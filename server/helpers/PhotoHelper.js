'use strict';
import S3 from './../components/S3';
import path from 'path';
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