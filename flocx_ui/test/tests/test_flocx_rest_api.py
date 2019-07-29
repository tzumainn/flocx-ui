import json
from unittest import mock

from openstack_dashboard.test import helpers as test

from flocx_ui.api.flocx_rest_api import Offers as OffersAPI
from flocx_ui.api.flocx_rest_api import Offer as OfferAPI
from flocx_ui.test.tests.helpers import get_test_data, RequestFactory

class RestApiTests(test.TestCase):
    """
    Rest API tests ensure that service endpionts call the correct
    flocx service methods and that validation of certain data from
    the endpoints are in fact validated and will error correctly.
    """
    @mock.patch('flocx_ui.api.flocx.offer_list')
    def test_get_offers(self, mock_offer_list):
        """
        Getting the /api/flocx/offer/ endpoint should return a
        list of offers from the flocx service method
        """
        testData = get_test_data('offer_list')
        mock_offer_list.return_value = testData

        rf = RequestFactory()
        request = rf.get('/api/flocx/offer/')

        offersAPI = OffersAPI()
        response = offersAPI.get(request)
        self.assertEqual(response.json, testData)

    @mock.patch('flocx_ui.api.flocx.offer_create')
    def test_create_offer(self, mock_offer_create):
        testData = get_test_data('offer')
        mock_offer_create.return_value = testData

        rf = RequestFactory()
        request = rf.post('/api/flocx/offer/',
                          data=json.dumps(testData),
                          content_type='application/json')

        offersAPI = OffersAPI()
        response = offersAPI.post(request)
        self.assertEqual(response.json, testData)

    @mock.patch('flocx_ui.api.flocx.offer_get')
    def test_get_offer(self, mock_offer_get):
        testData = get_test_data('offer')
        mock_offer_get.return_value = testData
        offer_id = testData['marketplace_offer_id']

        rf = RequestFactory()
        request = rf.get('/api/flocx/offer/{}'.format(offer_id))

        offerAPI = OfferAPI()
        response = offerAPI.get(request, offer_id)
        self.assertEqual(response.json, testData)
