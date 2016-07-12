'use strict';
angular.module('healthStarsApp')
.directive('compareTo', function() {
  return {
    require: 'ngModel',
    scope: {
      confirmPassword: '=compareTo'
    },
    link: function(scope, element, attributes, modelVal) {

      modelVal.$validators.compareTo = function(val) {
        return val === scope.confirmPassword;
      };

      scope.$watch('confirmPassword', function() {
        modelVal.$validate();
      });
    }
  };
})
.directive('addthisToolbox', ['$timeout', function($timeout) {
  return {
    restrict : 'A',
    replace : true,
    scope: {
      title: '=',
      description: '=',
      url: '=',
      fb: '=',
      tw: '=',
      gg: '=',
      autoShare: '@'
    },
    template : 
      `<div class="addthis_toolbox addthis_default_style addthis_32x32_style">
        <a ng-show="fb" class="addthis_button_facebook"></a>
        <a ng-show="tw" class="addthis_button_twitter"></a>
        <a ng-show="gg" class="addthis_button_google_plusone_share"></a>
      </div>`,
    link : function($scope, element) {
      $timeout(function () {
        var title, description, url;
        $scope.$watchGroup(['title', 'description', 'url'], (value) => {
          title = value[0];
          description = value[1];
          url = value[2];
          if (title && description && url) {
            addthis.init();
            addthis.toolbox($(element).get(), {}, {
              url: url,
              title : title,
              description : description
            });
            if ($scope.fb && $scope.autoShare === 'fb') {
              angular.element(element).find('.addthis_button_facebook').trigger('click');
            }
          }
        });

        addthis.addEventListener('addthis.menu.share', (ev) => {
          console.log(ev);
        });
      });
    }
  };
}]);