'use strict';
import {S3, GM} from './../../components';
import fs from 'fs';
import path from 'path';
import async from 'async';

exports.core = (kernel) => {
	/**
   * process single file
   * @param {Object} options
   * {
   *   width: 500
   *   height: 500
   *   addWatermark: false
   * }
   */
  function doProcess(filePath, options, cb) {
    //convert, add watermark to the file then upload to S3.
    //callback to result (s3 url, S3 key)
    let fileConvertedPath;
    async.waterfall([
      (cb) => {
        if (options.originalFile) {
          return cb(null, {path: filePath});
        } else if (options.public) {
          GM.resizeAndAddWatermark(filePath, options.gmOptions, cb);
        } else {
          GM.resize(filePath, options.gmOptions, cb);
        }
      },
      (result, cb) => {
        fileConvertedPath = result.path;
        //do upload
        S3.uploadFile(result.path, options.s3Options, cb);
      }
    ], (err, s3Object) => {
      if (err) { return cb(err); }

      //remove converted file
      if (!options.originalFile) {
        fs.unlink(fileConvertedPath);
      }

      cb(null, {
        s3Url: options.public ? S3.getPublicUrl(s3Object.key) : s3Object.signedUrl,
        key: s3Object.key
      });
    });
  }

	// Process uploaded photo to s3
	kernel.queue.process('PROCESS_AWS', (job, done) => {
		let filePath = path.resolve(kernel.config.tmpPhotoFolder+'/'+job.data.metadata.tmp);
		let folder = 'photos';
		let result = {
      metadata: {},
      processDone: true //result after process successfully
    };

    async.waterfall([
      //create thumbnail url for public
      (cb) => {
        let options = {
          gmOptions: { width: 250, height: 250 }, //small
          s3Options: {
            s3Params: {
              ACL: 'public-read'
            },
            folder: folder
          },
          public: false
        };
        doProcess(filePath, options, cb);
      },
      (data, cb) => {
        //finish small size
        result.metadata.small = data.s3Url;

        let options = {
          gmOptions: { width: 940, height: 640 }, //medium
          s3Options: {
            s3Params: {
              ACL: 'public-read'
            },
            folder: folder
          },
          public: false
        };
        doProcess(filePath, options, cb);
      },
      (data, cb) => {
        //finish small size
        result.metadata.medium = data.s3Url;

        let options = {
          gmOptions: { width: 2000, height: 2000 }, //large
          s3Options: {
            s3Params: {
              ACL: 'public-read'
            },
            folder: folder
          },
          public: false
        };
        doProcess(filePath, options, cb);
      },
      (data, cb) => {
        //finish large size
        result.metadata.large = data.s3Url;
        cb();
      }
    ], (err) => {
    	if (err) {
    		done(err);
    	} else {
	      fs.unlink(filePath);
	      // DB update
	      kernel.model.Photo.findById(job.data._id).then(photo => {
	      	photo.metadata = result.metadata;
	      	photo.save().then(() => {
	      		done();
	      	}).catch(err => {
	      		done(err);
	      	})
	      }).catch(err => {
	      	done(err);
	      });
    	}
    });
	});
};