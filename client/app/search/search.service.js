'use strict';

(function() {

  function SearchParams($http, APP_CONFIG) {
    let _default =  {
      keywords: '',
      address: {},
      postCode: '',
      radius: '',
      startDate: '',
      endDate: '',
      friendActivities: false,
      category: '',
      categories: []
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
        categories: []
      }
    };
  }

  angular.module('healthStarsApp')
    .factory('SearchParams', SearchParams);
})();
