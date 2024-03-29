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
.filter('avatarUrl', function($http){
  return function(profile){
    let avatarUrl = '/assets/images/no-avatar.png';
    if(!profile || !profile.provider) {
      return avatarUrl;
    }
    switch(profile.provider) {
      case 'google':
        avatarUrl = (profile.google && profile.google.image) ? profile.google.image.url : '/assets/images/no-avatar.png';
        break;
      case 'facebook':
        avatarUrl = `https://graph.facebook.com/${profile.facebook.id}/picture?width=300&height=300`;
        break;
      case 'twitter':
        avatarUrl = `https://twitter.com/${profile.twitter.screen_name}/profile_image?size=original` || profile.twitter.profile_image_url_https;
        break;
      default:
        avatarUrl = avatarUrl;
        break;
    }
    if (profile.avatar && profile.avatar.metadata) {
      avatarUrl = (profile.avatar.metadata.small) ? profile.avatar.metadata.small : profile.avatar.metadata.original;
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
.filter('multipleLanguageDate', ($localStorage) => {
  return (date) => {
    console.log(date);
    console.log(date.split(' '));

  };
})
.filter('categoryName', () => {
  return (category) => {
    let name = category.name;
    if (category) {
      switch(category.name) {
        case 'Cat A':
          name = 'Food';
          break;
        case 'Cat B':
          name = 'Action';
          break;
        case 'Cat C':
          name = 'Eco';
          break;
        case 'Cat D':
          name = 'Social';
          break;
        case 'Cat E':
          name = 'Sport';
          break;
        default:
          break;
      }
    }
    return name;
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
.filter('eventAwardImageUrl', () => {
  return (award, type) => {
    if (award) {
      let url = '/assets/images/img.jpg';
      let photo = award.objectPhotoId;
      if (photo && photo.metadata) {
        switch (type) {
          case 'small':
            url = (photo.metadata.small) ? photo.metadata.small : photo.metadata.original;
            break;
          case 'medium':
            url = (photo.metadata.medium) ? photo.metadata.medium : photo.metadata.original;
            break;
          case 'large':
            url = (photo.metadata.large) ? photo.metadata.large : photo.metadata.original;
            break;
          default:
            url = photo.metadata.original;
            break;
        }
      } else {
        switch (award.objectName) {
          case 'Foodstar Point': 
            url = '/assets/images/star1_banner.png';
            break;
          case 'Sportstar Point':
            url = '/assets/images/star_banner.png';
            break;
          case 'Socialstar Point':
            url = '/assets/images/star2_banner.png';
            break;
          case 'Actionstar Point':
            url = '/assets/images/star4_banner.png';
            break;
          case 'Ecostar Point':
            url = '/assets/images/star3_banner.png';
            break;
          default:
            break;
        }
      }
      return url;
    }
  };
})
.filter('imageUrl', () => {
  return (image, type) => {
    let imagePath = '/assets/images/img.jpg';
    if (image) {
      switch (type) {
        case 'small':
          imagePath = (image.metadata.small) ? image.metadata.small : image.metadata.original;
          break;
        case 'medium':
          imagePath = (image.metadata.medium) ? image.metadata.medium : image.metadata.original;
          break;
        case 'large':
          imagePath = (image.metadata.large) ? image.metadata.large : image.metadata.original;
          break;
        default:
          imagePath = image.metadata.original;
          break;
      }
    }
    return imagePath;
  };
})
.filter('imageMyAwardUrl', () => {
  return (award, type) => {
    let imagePath;
    let image  = award.objectPhotoId;
    if (image) {
      switch (type) {
        case 'small':
          imagePath = (image.metadata.small) ? image.metadata.small : image.metadata.original;
          break;
        case 'medium':
          imagePath = (image.metadata.medium) ? image.metadata.medium : image.metadata.original;
          break;
        case 'large':
          imagePath = (image.metadata.large) ? image.metadata.large : image.metadata.original;
          break;
        default:
          imagePath = image.metadata.original;
          break;
      }
    } else {
      
    }
    return imagePath;
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
      }
      return className;
    }
  };
})
.filter('eventThumbnail', () => {
  return (event) => {
    let imageUrl = '/assets/images/img.jpg';
    let selectedImage;
    let photos = event.photosId;
    let category = event.categoryId;
    if (photos && photos.length > 0) {
      angular.forEach(photos, (photo) => {
        if (!photo.blocked && photo._id) {
          selectedImage = photo;
        }
        if (selectedImage && selectedImage._id) {
          return false;
        }
      });
      if (selectedImage && selectedImage._id) {
        imageUrl = (selectedImage.metadata.small) ? selectedImage.metadata.small : selectedImage.metadata.original;
      }
    } else if (category && category.type && category.imagePath) {
      switch (category.type) {
        case 'food':
          imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star1_banner.png';
          break;
        case 'action':
          imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star4_banner.png';
          break;
        case 'eco':
          imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star3_banner.png';
          break;
        case 'social':
          imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star2_banner.png';
          break;
        case 'internation':
          imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : '/assets/images/star_banner.png';
          break;
        default:
          imageUrl = category.imagePath;
          break;
      }
    }
    return imageUrl;
  };
})
.filter('eventBanner', () => {
  return (event) => {
    let banner = event.banner;
    let category = event.categoryId;
    let image = 'assets/images/img-pro1.jpg';
    if (banner && banner.metadata) {
      image = (banner.metadata.large) ? banner.metadata.large : banner.metadata.original;
    } else if (category && category._id) {
      switch (category.type) {
        case 'food':
          image = 'assets/images/foodstar.jpg';
          break;
        case 'action':
          image = 'assets/images/actionstar.jpg';
          break;
        case 'eco':
          image = 'assets/images/ecostar.jpg';
          break;
        case 'social':
          image = 'assets/images/socialstar.jpg';
          break;
        case 'internation':
          image = 'assets/images/sport.jpg';
          break;
        default:
          break;
      }
    }
    return image;
  };
})
.filter('showBlocked', () => {
  return (items, isShowActive) => {
    if (items && items.length > 0) {
      let result = _.filter(items, (item) => {
        return item.blocked===isShowActive;
      });
      return result;
    } else {
      return items;
    }
  };
})
.filter('showDeleted', () => {
  return (items, isShowActive) => {
    if (items && items.length > 0) {
      let result = _.filter(items, (item) => {
        return item.deleted===isShowActive;
      });
      return result;
    } else {
      return items;
    }
  };
})
.filter('showChecked', () => {
  return (items, isShowActive) => {
    if (items && items.length > 0) {
      let result = _.filter(items, (item) => {
        return item.checked===isShowActive;
      });
      return result;
    } else {
      return items;
    }
  };
})
.filter('userBannerUrl', () => {
  return (user) => {
    let url = '/assets/images/img-pro.jpg';
    if (user && user.coverPhoto) {
      url = (user.coverPhoto.metadata.large) ? user.coverPhoto.metadata.large : user.coverPhoto.metadata.original;
    }
    return url;
  };
}).filter('nl2br', () => {
  return (data) => {
    if (!data) {
      return data; 
    }
    return data.replace(/\n\r?/g, '<br />');
  };
}).filter('html', ['$sce', ($sce) => {
  return (text) => {
    if (text) {
      return $sce.trustAsHtml(text.replace(/(http[^\s]+)/g, '<a href="$1">$1</a>'));
    } else {
      return text;
    }
  };
}]).filter('showAgoTextInDeLanguage', () => {
  return (text) => {
    if (text==='an hour ago') {
      text = 'AN_HOUR_AGO';
    } else if (text==='a day ago') {
      text = 'A_DAY_AGO';
    } else if (text==='a month ago') {
      text = 'A_MONTH_AGO';
    } else if (text==='a year ago') {
      text = 'A_YEAR_AGO';
    } else if (text==='a few seconds ago') {
      text = 'A_FEW_SECONDS_AGO';
    } else if (text ==='a minute ago') {
      text = 'A_MINUTE_AGO';
    } else {
      let tmp = text.split(' ');
      if (tmp[1]==='days') {
        text = 'DAYS_AGO';
      } else if (tmp[1]==='months') {
        text = 'MONTHS_AGO';
      } else if (tmp[1] === 'years') {
        text = 'YEARS_AGO';
      } else if (tmp[1] === 'hours') {
        text = 'HOURS_AGO';
      } else if (tmp[1] === 'minutes') {
        text = 'MINUTES_AGO';
      }
    }
    if (text==='MINUTES_AGO') {
      return true;
    } else {
      return false;
    }
  };
}).filter('fromNowTranslate', () => {
  return (text) => {
    if (text==='an hour ago') {
      text = 'AN_HOUR_AGO';
    } else if (text==='a day ago') {
      text = 'A_DAY_AGO';
    } else if (text==='a month ago') {
      text = 'A_MONTH_AGO';
    } else if (text==='a year ago') {
      text = 'A_YEAR_AGO';
    } else if (text==='a few seconds ago') {
      text = 'A_FEW_SECONDS_AGO';
    } else if (text ==='a minute ago') {
      text = 'A_MINUTE_AGO';
    } else {
      let tmp = text.split(' ');
      if (tmp[1]==='days') {
        text = 'DAYS_AGO';
      } else if (tmp[1]==='months') {
        text = 'MONTHS_AGO';
      } else if (tmp[1] === 'years') {
        text = 'YEARS_AGO';
      } else if (tmp[1] === 'hours') {
        text = 'HOURS_AGO';
      } else if (tmp[1] === 'minutes') {
        text = 'MINUTES_AGO';
      }
    }
    return text;
  };
}).filter('fromNowNumber', () => {
  return (text) => {
    let tmp = text.split(' ');
    if (tmp[1]==='days' || tmp[1]==='months' || tmp[1] === 'years' || tmp[1] === 'hours' || tmp[1]==='minutes') {
      text = tmp[0];
    } else {
      text = '';
    }
    return text;
  };
})
.filter('countAward', () => {
  return (number) => {
    if (number) {
      return number > 999 ? (number/1000).toFixed(1) + 'k' : number;
    } else {
      return 0;
    }
  };
})
.filter('hsStatusStar', () => {
  return post => {
    post = Number(post);
    let link;
    if (post < 100) {
      link = '/assets/images/fan_star.png';
    } else if (post < 500) {
      link = '/assets/images/bronze_star.png';
    } else if (post < 2000) {
      link = '/assets/images/silver_star.png';
    } else if (post < 5000) {
      link = '/assets/images/gold_star.png';
    } else if (post < 10000) {
      // todo ask for platinum star
      link = '/assets/images/silver_star.png';
    } else {
      link = '/assets/images/create_event_btn.png';
    }
    return link;
  };
})
.filter('hsStatus', () => {
  return post => {
    post = Number(post);
    let text;
    if (post < 100) {
      text = 'Fan';
    } else if (post < 500) {
      text = 'Bronze';
    } else if (post < 2000) {
      text = 'Silver';
    } else if (post < 5000) {
      text = 'Gold';
    } else if (post < 1000) {
      text = 'Platinum';
    } else {
      text = 'The Healthstars'
    }
    return text;
  };
})
.filter('datePickerFilter', ($localStorage) => {
  return text => {
    let splitted = text.split(' ');
    let item = splitted[0];
    let result = '';
    
    if (item && $localStorage.language==='en') {
      switch (item.toLowerCase()) {
        // for month
        case 'january':
          result = 'January';
          break;
        case 'february':
          result = 'february';
          break;
        case 'march':
          result = 'March';
          break;
        case 'april':
          result = 'April';
          break;
        case 'may':
          result = 'May';
          break;
        case 'june':
          result = 'June';
          break;
        case 'july':
          result = 'July';
          break;
        case 'august':
          result = 'August';
          break;
        case 'september':
          result = 'September';
          break;
        case 'october':
          result = 'Obtober';
          break;
        case 'november':
          result = 'November';
          break;
        case 'december':
          result = 'December';
          break;

        // for day
        case 'sun':
          result = 'Sun';
          break;
        case 'mon':
          result = 'Mon';
          break;
        case 'tue':
          result = 'Tue';
          break;
        case 'wed':
          result = 'Wed';
          break;
        case 'thu':
          result = 'Thu';
          break;
        case 'fri':
          result = 'Fri';
          break;
        case 'sat':
          result = 'Sat';
          break;

        // other
        case 'today':
          result = 'Today';
          break;
        case 'clear':
          result = 'Clear';
          break;
        case 'done':
          result = 'Done';
          break;
        default:
          break;
      };
    } else if (item && $localStorage.language==='de') {
      switch (item.toLowerCase()) {
        // Month
        case 'january':
          result = 'Januar';
          break;
        case 'february':
          result = 'Februar';
          break;
        case 'march':
          result = 'März';
          break;
        case 'april':
          result = 'April';
          break;
        case 'may':
          result = 'Mai';
          break;
        case 'june':
          result = 'Juni';
          break;
        case 'july':
          result = 'Juli';
          break;
        case 'august':
          result = 'August';
          break;
        case 'september':
          result = 'September';
          break;
        case 'october':
          result = 'Oktober';
          break;
        case 'november':
          result = 'November';
          break;
        case 'december':
          result = 'Dezember';
          break;

        // for day
        case 'sun':
          result = 'So';
          break;
        case 'mon':
          result = 'Mo';
          break;
        case 'tue':
          result = 'Di';
          break;
        case 'wed':
          result = 'Mi';
          break;
        case 'thu':
          result = 'Do';
          break;
        case 'fri':
          result = 'Fr';
          break;
        case 'sat':
          result = 'Sa';
          break;

        // other
        case 'today':
          result = 'Heute';
          break;
        case 'clear':
          result = 'Löschen';
          break;
        case 'done':
          result = 'übernehmen';
          break;
        default:
          break;
      };
    }
    if (splitted[1]) {
      result += ' ' + splitted[1];
    }
    if (splitted[2]) {
      result += ' ' + splitted[2];
    }
    if (splitted[3]) {
      result += ' ' + splitted[3];
    }
    if (splitted[4]) {
      result += ' ' + splitted[4];
    }
    return result;
  };
})
.filter('weatherTemperatureConverter', () => {
  return temperature => {
    return Math.round((temperature - 32) / 1.8);
  };
})
.filter('weatherDayFilter', ($localStorage) => {
  return day => {
    if ($localStorage.language==='en') {
      return day;
    } else {
      let text;
      switch (day.toLowerCase()) {
        case 'monday':
          text = 'Montag';
          break;
        case 'tuesday':
          text = 'Dienstag';
          break;
        case 'wednesday':
          text = 'Mittwoch';
          break;
        case 'thursday':
          text = 'Donnerstag';
          break;
        case 'friday':
          text = 'Freitag';
          break;
        case 'saturday':
          text = 'Samstag';
          break;
        case 'sunday':
          text = 'Sonntag';
          break;
        default:
          break;
      }
      return text;
    }
  };
})
.filter('amAndPmFilter', ($localStorage) => {
  return hour => {
    if ($localStorage.language==='en') {
      return hour;
    } else {
      let text = hour.split(' ')[0] + ' Uhr';
      return text;
    }
  };
});
