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
.directive('dragMe', function() {
  return {
    restrict: 'A',
    scope: {
      oldTop: '='
    },
    link: function(scope, element) {
      element.css('background-position', '0px '+scope.oldTop+'px');
      element.draggable({
        stop: function(event, ui) {
          scope.oldTop = scope.oldTop+ui.position.top;
          if (scope.oldTop > 0) {
            scope.oldTop = 0;
          }
          console.log(scope.oldTop);
          element.css('background-position', '0px '+scope.oldTop+'px');
        }
      });
    }
  };
})
.directive('autoFocus', function($timeout) {
  return {
    scope: {trigger: '=autoFocus'},
    link: function(scope, element) {
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
.directive('shareToolBox', ['$timeout', 'ShareService', '$state', 'APP_CONFIG', 'growl', function($timeout, ShareService, $state, APP_CONFIG, growl) {
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
      allowShow: '=',
      startDate: '=',
      endDate: '=',
      location: '=',
      category: '='
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
              url = APP_CONFIG.baseUrl + 'event/detail/'+$state.params.id;
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
          $scope.url = APP_CONFIG.baseUrl + 'event/detail/'+$state.params.id;
        }
      }
      $scope.share = function(type) {
        if (type === 'fb') {
          let photo = 'https://fbrell.com/f8.jpg';
          
          if ($scope.category && $scope.category._id) {
            let category = angular.copy($scope.category);

            switch(category.type) {
              case 'food':
                photo = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star1.png';
                break;
              case 'action':
                photo = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star4.png';
                break;
              case 'eco':
                photo = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star3.png';
                break;
              case 'social':
                photo = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star2.png';
                break;
              case 'internation':
                photo = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star.png';
                break;
              default:
                photo = category.imagePath;
                break;
            }
          }

          if ($scope.photo && $scope.photo.metadata) {
            if ($scope.photo.metadata.large) {
              photo = $scope.photo.metadata.large;
            } else if ($scope.photo.metadata.original) {
              photo = $scope.photo.metadata.original;
            }
          }

          let description = angular.copy($scope.description);
          if ($scope.location) {
            description += '. Location: '+ $scope.location;
          }
          let startDate = moment($scope.startDate);
          let endDate = moment($scope.endDate);
          if ($scope.startDate && $scope.endDate) {
            if (moment(startDate.format('YYYY-MM-DD')).isSame(endDate.format('YYYY-MM-DD'))) {
              // If start date, end date is the same day
              description += '. Timing: ' + startDate.format('DD.MMMM.YYYY') + ' ' + startDate.format('HH:mm') + ' - ' + endDate.format('HH:mm');
            } else {
              // If start date, end date is not the same day
              description += '. Timing: ' + startDate.format('DD.MMMM.YYYY') + ' - ' + endDate.format('DD.MMMM.YYYY');
            }
          }
          FB.ui({
            method: 'feed',
            name: $scope.title,
            link: $scope.url,
            picture: photo,
            caption: $scope.title,
            description: description
          }, function(response) {
            if (response && response.post_id) {
              ShareService.share($scope.data._id, $scope.type).then(() => {
                $scope.data.totalShare = ($scope.data.totalShare) ? $scope.data.totalShare+1 : 1;
                $scope.shared = !$scope.shared;
              }).catch(() => {
                growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
              });
            } else {
              // growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
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
                }).catch(() => {
                  growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
                });
              }
            });
          });
        } else if (type === 'gg') {
          ShareService.share($scope.data._id, $scope.type).then(() => {
            $scope.data.totalShare = ($scope.data.totalShare) ? $scope.data.totalShare+1 : 1;
            $scope.shared = !$scope.shared;
          }).catch(() => {
            growl.error(`<p>{{'SOMETHING_WENT_WRONG' | translate}}</p>`);
          });
        }
      };
    }
  };
}]);