'use strict';

(function() {

  function SearchParams($http, APP_CONFIG) {
    return {
      keywords: '',
      address: '',
      postion: '',
      postCode: '',
      radius: '',
      startDate: '',
      endDate: ''
    };
  }

  angular.module('healthStarsApp')
    .factory('SearchParams', SearchParams);
})();
