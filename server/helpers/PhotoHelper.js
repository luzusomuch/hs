'use strict';
import S3 from './../components/S3';
import path from 'path';
import _ from 'lodash';
import config from './../config/environment';

function doProcess(filePath, options, cb) {
  S3.uploadFile(filePath, options.s3Options, (err, s3Object) => {
  	if (err) {console.log(err); return cb(err); }

  	return cb(null, {
      s3Url: options.public ? S3.getPublicUrl(s3Object.key) : s3Object.signedUrl,
      key: s3Object.key
  	});
  });
}


exports.UploadOriginPhoto = (photo, callback) => {
	let filePath = path.resolve(config.tmpPhotoFolder+'/'+photo.metadata.tmp);
	let folder = 'photos';

	let options = {
  	gmOptions: {originalFile: true},
  	s3Options: {
      s3Params: {
      	ACL: 'public-read'
      },
      folder: folder
  	},
  	public: true
  };


	doProcess(filePath, options, (err, result) => {
		if (err) {
			console.log('error when upload originalFile');
			console.log(err);
			return callback(err);
		}
		console.log('upload originalFile success');
		return callback(null, {s3url: result.s3Url, key: result.key});
	});
};

exports.getUserAvatar = (user) => {
  let userAvatar = config.baseUrl + 'assets/images/no-avatar.png';
  switch(user.provider) {
    case 'google':
      userAvatar = (user.google && user.google.image) ? user.google.image.url : '/assets/images/no-avatar.png';
      break;
    case 'facebook':
      userAvatar = `https://graph.facebook.com/${user.facebook.id}/picture?width=300&height=300`;
      break;
    case 'twitter':
      userAvatar = `https://twitter.com/${user.twitter.screen_name}/profile_image?size=original` || user.twitter.profile_image_url_https;
      break;
    default:
      userAvatar = userAvatar;
      break;
  }
  if (user.avatar && user.avatar.metadata) {
    userAvatar = (user.avatar.metadata.small) ? user.avatar.metadata.small : user.avatar.metadata.original;
  }
  return userAvatar;
};

exports.getEventThumbnail = (event) => {
  let imageUrl = config.baseUrl + 'assets/images/img.jpg';
  let selectedImage;
  let photos = event.photosId;
  let category = event.categoryId;
  if (photos && photos.length > 0) {
    _.each(photos, (photo) => {
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
        imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : config.baseUrl + 'assets/images/star1_banner.png';
        break;
      case 'action':
        imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : config.baseUrl + 'assets/images/star4_banner.png';
        break;
      case 'eco':
        imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : config.baseUrl + 'assets/images/star3_banner.png';
        break;
      case 'social':
        imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : config.baseUrl + 'assets/images/star2_banner.png';
        break;
      case 'internation':
        imageUrl = (category.imagePath && category.imagePath !== 'pathToImage') ? category.imagePath : config.baseUrl + 'assets/images/star_banner.png';
        break;
      default:
        imageUrl = category.imagePath;
        break;
    }
  }


  return imageUrl;
};