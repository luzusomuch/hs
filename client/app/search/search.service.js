'use strict';

(function() {

  function SearchParams() {
    let _default =  {
      keywords: '',
      address: {},
      postCode: '',
      radius: '',
      dates: [],
      startDate: '',
      endDate: '',
      friendActivities: false,
      category: '',
      categories: [],
      companyAccountEvents: false
    };
    return {
      _default: function() {
        return _default;
      },
      params: {
        keywords: '',
        address: {},
        postCode: '',
        radius: '',
        dates: [],
        startDate: '',
        endDate: '',
        friendActivities: false,
        category: '',
        categories: [],
        companyAccountEvents: false
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('SearchParams', SearchParams);
})();
