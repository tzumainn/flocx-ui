(function() {
  'use strict';

  /**
   * Controller used to create an offer for a specified node
   */
  angular
    .module('horizon.dashboard.project.flocx')
    .controller('CreateOfferController', CreateOfferController);

  CreateOfferController.$inject = [
    '$filter',
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.flocx',
    'horizon.dashboard.project.flocx.hourRegex',
    'horizon.dashboard.project.flocx.defaultOfferDaysDifference',
    'horizon.framework.util.uuid.service',
    'horizon.framework.widgets.toast.service',
    'node'
  ];

  function CreateOfferController($filter,
                                $uibModalInstance,
                                flocx,
                                hourRegex,
                                offerDaysDifference,
                                uuid,
                                toastService,
                                node) {
    var ctrl = this;

    // Import time filter from date.filter.js
    var dateToUTC = $filter('dateToUTC');

    var today = new Date();
    var endDateMs = (new Date()).setDate(today.getDate() + offerDaysDifference);
    var endDate = new Date(endDateMs);
    var todayString = today.toLocaleDateString();
    var endDateString = endDate.toLocaleDateString();
    var todayTimeString = getNextHourString(today);
    var endDateTimeString = getNextHourString(endDate);
    var config = node.properties;

    ctrl.name = node.name || node.uuid;
    ctrl.startDate = todayString;
    ctrl.endDate = endDateString;
    ctrl.startTime = todayTimeString;
    ctrl.endTime = endDateTimeString;
    ctrl.hourPattern = hourRegex;
    ctrl.config = JSON.stringify(config, undefined, 2);

    /**
     * @description Get the next hour after a given date as a string of the form: [hh AM/PM]
     * @param {Date} date The JavaScript date given
     * @returns {string} A string interpretation of the next hour
     */
    function getNextHourString (date) {
      date.setHours(date.getHours() + Math.ceil(date.getMinutes() / 60));
      date.setMinutes(0);

      var timeString = date.toLocaleTimeString([], { hour: 'numeric' });
      return timeString;
    }

    /**
     * @description Convert a JavaScript date string string to a MySQL compatible format
     * @param {string} dateString The date used in the created date
     * @param {string} timeString The time used in the created date
     *
     * @returns {string} A MySQL compatible datetime string
     */
    function convertToDatetime (dateString, timeString) {
      // Add `:00` to the time (from 9 AM to 9:00 AM) to make it compatible with JavaScript Date
      var modifiedTimeString = timeString.slice(0, -3) + ':00' + timeString.slice(-3);
      var compatibleDate = dateString + ' ' + modifiedTimeString;

      return dateToUTC(new Date(compatibleDate));
    }

    /**
     * @description Display a notification when an offer creation error occurs
     * @param {*} err The error text to be displayed
     *
     * @return {void}
     */
    function displayOfferCreationError (err) {
      toastService.add('error', 'Failed to create offer. ' + err);
    }

    /**
     * Create the defined offer
     *
     * @return {promise} A promise that resolves when the offer is created
     */
    ctrl.createOffer = function() {
      var offer;

      try {
        var configJSON = JSON.parse(ctrl.config);

        offer = {
          resource_type: 'ironic_node',
          resource_uuid: node.uuid,
          start_date: convertToDatetime(ctrl.startDate, ctrl.startTime),
          end_date: convertToDatetime(ctrl.endDate, ctrl.endTime),
          properties: configJSON
        };
      } catch (err) {
        return displayOfferCreationError(err);
      }

      // Attempt to create the offer
      return flocx.createOffer(offer)
        .then(function(createdOffer) {
          $uibModalInstance.close(createdOffer);
        })
        .catch(function (error) {
          displayOfferCreationError(error.data);
        });
    };
  }
}());
