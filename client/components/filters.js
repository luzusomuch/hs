'use strict';

angular.module('healthStarsApp')
.filter('removeSpaces', function() {
  return function(string) {
    return angular.isDefined(string) ? string.replace(/\s/g, '') : '';
  };
})
.filter('fromNow', function() {
  return function(string) {
    return angular.isDefined(string) ? moment(string).fromNow() : '';
  };
})
.filter('elipsis', function() {
  return function(string, count) {
    if (angular.isDefined(string) && _.isString(string)) {
      return string.length > count ? string.substring(0, count) + '...' : string;
    } else {
      return '';
    }
  };
})
.filter('ucFirst', function() {
  return function(string) {
    return angular.isDefined(string) ? string.charAt(0).toUpperCase() + string.slice(1) : '';
  };
})
.filter('linkify', function () {
  return function (text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp, '<a href="$1" target="_blank">$1</a>');
  };
})
.filter('htmlToPlaintext', function() {
  return function(text) {
    var tag = document.createElement('div');
    tag.innerHTML = text;

    return tag.innerText;
    //return String(text).replace(/<[^>]+>/gm, '');
  };
})
.filter('phoneNumber', function() {
  return function(str) {
    if(typeof str !== 'string'){ return ''; }

    //format number
    var rawNumber = str.replace(/[^0-9]/g,'');
    var regex = /^1?([2-9]..)([2-9]..)(....)$/;

    return rawNumber.replace(regex,'($1) $2 $3');
  };
})
.filter('decimal', function () {
    return function (input, places) {
      return !isNaN(input) ? parseFloat(input).toFixed(places) : input;
    };
  }
)
.filter('age', function(){
  return function(input, defaultText){
    defaultText = defaultText || 'Unknown';
    if(!input || !input.date || (!input.date.start && !input.date.end)){return 'Unknown'; }
    else{
      var birthdate = new Date(input.date.start);
      var cur;
      if(input.date.end){
        cur = new Date(input.date.end);
      }else{
        cur = new Date();
      }
      var diff = cur-birthdate; // This is the difference in milliseconds
      return Math.floor(diff/31536000000); // Divide by 1000*60*60*24*365
    }
  };
})
.filter('avatarUrl', function(){
  return function(profile){
    let avatarUrl = '/assets/images/no-avatar.png';
    if(!profile || !profile.provider) {
      return avatarUrl;
    }
    switch(profile.provider) {
      case 'google':
        avatarUrl = profile.avatar || profile.google.image.url;
        break;
      case 'facebook':
        avatarUrl = profile.avatar || `http://graph.facebook.com/${profile.facebook.id}/picture?width=300&height=300`;
        break;
      case 'twitter':
        avatarUrl = profile.avatar || profile.twitter.profile_image_url_https;
        break;
      default:
        avatarUrl = profile.avatar || avatarUrl;
        break;
    }
    return avatarUrl;
  };
})
.filter('name', function() {
  return function(profile){
    return [profile.firstName, profile.lastName].join(' ');
  };
})
.filter('address', function() {
  return function(profile){
    if (!profile.profileAddress) { return ''; }

    return profile.profileAddress.fullAddress;
  };
})
.filter('gearIcon', function() {
  return function(key){
    let icon;
    switch(key) {
      case 'cameraModel':
        icon = 'camera.png';
        break;
      case 'lensBrand':
        icon = 'lens.png';
        break;
      case 'iso':
        icon = 'iso.png';
        break;
      case 'takenTime':
        icon = 'time.png';
        break;
      case 'aperture':
        icon = 'aperture.png';
        break;
      case 'angle':
        icon = 'angle';
        break;
      default:
        icon = 'camera.png';
        break;
    }

    return `/assets/images/icons/${icon}`;
  };
})
.filter('gearText', function() {
  return function(key, object){
    let text;
    switch(key) {
      case 'takenTime':
        text = [object.takenDate, object.takenTime].join(' ');
        break;
      case 'iso':
        text = `ISO ${object.iso}`;
        break;
      default:
        text = object[key];
        break;
    }

    return text;
  };
})
.filter('hsDate', function(){
  return function(time, format) {
    var date = new Date(time);
    if(typeof date !== 'object') {
      return date;
    }
    return moment(date).format(format);
  };
})
.filter('categoryImagePath', function() {
  return function(category) {
    var imagePath;
    if (category) {
      switch(category.type) {
        case 'food':
          imagePath = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star1.png';
          break;
        case 'action':
          imagePath = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star4.png';
          break;
        case 'eco':
          imagePath = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star3.png';
          break;
        case 'social':
          imagePath = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star2.png';
          break;
        case 'internation':
          imagePath = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star.png';
          break;
        default:
          imagePath = category.imagePath;
          break;
      }
    }
    return imagePath;
  };
})
.filter('trustAsResourceUrl', ['$sce', function($sce) {
    return function(val) {
        return $sce.trustAsResourceUrl(val);
    };
}])
.filter('imageUrl', () => {
  return (image, type) => {
    if (image) {
      let imagePath;
      switch (type) {
        case 'small':
          imagePath = (image.metadata.small) ? image.metadata.small : '/assets/photos/'+image.metadata.tmp;
          break;
        case 'medium':
          imagePath = (image.metadata.medium) ? image.metadata.medium : '/assets/photos/'+image.metadata.tmp;
          break;
        case 'large':
          imagePath = (image.metadata.large) ? image.metadata.large : '/assets/photos/'+image.metadata.tmp;
          break;
        default:
          imagePath = '/assets/photos/'+image.metadata.tmp;
          break;
      }
      return imagePath;
    }
  };
})
.filter('categoryClass', () => {
  return (category, color) => {
    if (category) {
      let className;
      switch (category.type) {
        case 'food':
        className = color ? 'li-orange color-orange' : 'li-orange';
        break;
      case 'action':
        className = color ? 'li-purple color-purple' : 'li-purple';
        break;
      case 'eco':
        className = color ? 'li-green color-green' : 'li-green';
        break;
      case 'social':
        className = color ? 'li-yellow color-yellow' : 'li-yellow';
        break;
      case 'internation':
        className = color ? 'li-blue color-blue' : 'li-blue';
        break;
      default:
        className = color ? 'li-blue color-blue' : 'li-blue';
        break;
      };
      return className;
    }
  }
})
.filter('eventThumbnail', () => {
  return (photos) => {
    let imageUrl = '/assets/images/img.jpg';
    let selectedImage;
    if (photos.length > 0) {
      angular.forEach(photos, (photo) => {
        if (!photo.blocked && photo._id) {
          selectedImage = photo;
        }
        if (selectedImage && selectedImage._id) {
          return false;
        }
      });
      if (selectedImage && selectedImage._id) {
        imageUrl = (selectedImage.metadata.small) ? selectedImage.metadata.small : '/assets/photos/'+selectedImage.metadata.tmp;
      }
    }
    return imageUrl;
  }
})
.filter('eventBanner', () => {
  return (banner) => {
    let image = 'assets/images/img-pro1.jpg';
    if (banner && banner.metadata) {
      image = (banner.metadata.large) ? banner.metadata.large : 'assets/photos/'+banner.metadata.tmp;
    }
    return image;
  }
})
.filter('activeEvents', () => {
  return (items, isShowActive) => {
    if (items && items.length > 0) {
      let result = _.filter(items, (item) => {
        return item.blocked===isShowActive;
      });
      return result;
    } else {
      return items;
    }
  }
});
