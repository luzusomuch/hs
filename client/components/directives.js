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
.directive('autoFocus', function($timeout) {
  return {
    scope: {trigger: '=autoFocus'},
    link: function(scope, element, attrs) {
      scope.$watch('trigger', function(value) {
        if(value === true) { 
          $timeout(function() {
            element[0].focus();
            scope.trigger = false;
          });
        }
      });
    }
  };
})
.directive('shareToolBox', ['$timeout', 'ShareService', '$state', 'APP_CONFIG', function($timeout, ShareService, $state, APP_CONFIG) {
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
      photo: '=',
      autoShare: '@',
      data: '=',
      type: '@',
      shared: '=',
      allowShow: '='
    },
    template : 
      `<div>
        <a class="share-fb-btn" ng-show="fb && allowShow" href='#' ng-click="share('fb')"><i class="fa fa-facebook-square" aria-hidden="true"></i></a>
        <a class="share-tw-btn" ng-show="tw && allowShow" ng-href='{{tweetUrl}}' ng-click="share('tw')"><i class="fa fa-twitter-square" aria-hidden="true"></i></a>
        <a class="share-gg-btn" ng-show="gg && allowShow" ng-href='{{ggUrl}}' ng-click="share('gg')" onclick="javascript:window.open(this.href,
  '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;"><i class="fa fa-google-plus-square" aria-hidden="true"></i></a>
      </div>`,
    link : function($scope, element) {
      // $timeout(function () {
        var title, description, url;
        $scope.$watchGroup(['title', 'description', 'url'], (value) => {
          title = value[0];
          description = value[1];
          url = value[2];

          if (!url) {
            if ($state.current.name==='event.detail') {
              url = APP_CONFIG.baseUrl + 'event/detail/'+$state.params.id
            }
          }

          if ($scope.tw) {
            $scope.tweetUrl = 'https://twitter.com/intent/tweet?url='+url;
          }
          if ($scope.gg) {
            $scope.ggUrl = 'https://plus.google.com/share?url='+url;
          }
          if (title && description && url) {
            if ($scope.fb && $scope.autoShare === 'fb') {
              angular.element(element).find('.share-fb-btn').bind('click', $scope.share('fb'));

              $scope.$on('$destroy', function(){
                angular.element(element).find('.share-fb-btn').unbind('click', $scope.share());
              });
            }
          }
        });
      // },500);
    },
    controller: function($scope) {
      if (!$scope.url) {
        if ($state.current.name==='event.detail') {
          $scope.url = APP_CONFIG.baseUrl + 'event/detail/'+$state.params.id
        }
      }
      $scope.share = function(type) {
        if (type === 'fb') {
          FB.ui({
            method: 'feed',
            name: $scope.title,
            link: $scope.url,
            picture: ($scope.photo) ? $scope.photo.metadata.medium : null,
            caption: $scope.title,
            description: $scope.description
          }, function(response) {
            if (response && response.post_id) {
              ShareService.share($scope.data._id, $scope.type).then(() => {
                $scope.data.totalShare = ($scope.data.totalShare) ? $scope.data.totalShare+1 : 1;
                $scope.shared = !$scope.shared;
              }).catch(err => {
                console.log(err);
                // TODO show error
              });
            } else {
              // TODO show dialog
            }
          });
        } else if (type === 'tw') {
          twttr.ready(function (twttr) {
            twttr.events.bind('tweet', function (event) {
              // your callback action here...
              if (event && event.type === 'tweet') {
                ShareService.share($scope.data._id, $scope.type).then(() => {
                  $scope.data.totalShare = ($scope.data.totalShare) ? $scope.data.totalShare+1 : 1;
                  $scope.shared = !$scope.shared;
                }).catch(err => {
                  console.log(err);
                  // TODO show error
                });
              }
            });
          });
        } else if (type === 'gg') {
          ShareService.share($scope.data._id, $scope.type).then(() => {
            $scope.data.totalShare = ($scope.data.totalShare) ? $scope.data.totalShare+1 : 1;
            $scope.shared = !$scope.shared;
          }).catch(err => {
            console.log(err);
            // TODO show error
          });
        }
      };
    }
  };
}]);