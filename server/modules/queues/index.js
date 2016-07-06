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
          public: true
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
          public: true
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
          public: true
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

  // grant award to participants
  kernel.queue.process('GRANT_AWARD', (job, done) => {
    kernel.model.Award.findById(job.data.awardId).then(award => {
      if (!award) {
        return done({error: 'Award Not Found'});
      } else {
        let autoGrantAwardType = ['accepted', 'gps'];
        if (autoGrantAwardType.indexOf(award.type) !== -1) {
          async.each(job.data.participantsId, (id, callback) => {
            kernel.model.User.findById(id).then(user => {
              if (!user) {
                return callback({error: 'User not found'});
              }
              if (award.type==='gps' && user.accessViaApp) {
                kernel.model.GrantAward({
                  ownerId: user._id,
                  awardId: award._id
                }).save().then(data => {
                  kernel.queue.create('EMAIL_GRANTED_AWARD', data).save();
                  callback();
                }).catch(err => {
                  callback(err);
                });
              } else if (award.type==="accepted") {
                kernel.model.GrantAward({
                  ownerId: user._id,
                  awardId: award._id
                }).save().then(data => {
                  kernel.queue.create('EMAIL_GRANTED_AWARD', data).save();
                  callback();
                }).catch(err => {
                  callback(err);
                });
              } else {
                callback();
              }
            }).catch(err => {
              callback(err);
            });
          }, () => {
            return done();
          });
        } else {
          return done();
        }
      }
    }).catch(err => {
      return done(err);
    });
  });

  // Email to user when he granted an award
  kernel.queue.process('EMAIL_GRANTED_AWARD', (job, done) => {
    kernel.model.GrantAward.findById(job.data._id)
    .populate('awardId')
    .populate('ownerId').exec().then(data => {
      if (!data) {
        done({error: 'Granted award not found'});
      } else {
        kernel.emit('SEND_MAIL', {
          template: 'granted-award.html',
          subject: 'New Award Granted',
          data: {
            user: data.ownerId, 
            award: data.awardId
          },
          to: data.ownerId.email
        });
        done();
      }
    }).catch(err => {
      done(err);
    });
  });

  // Update count for participants
  kernel.queue.process('PARTICIPANT_COUNT', (job, done) => {
    kernel.model.Event.findById(job.data._id).then(event => {
      if (!event) {
        done({error: 'Event not found'});
      } else {
        if (!event.stats) {
          event.stats = {
            totalParticipants: event.participantsId.length
          };
        } else {
          event.stats.totalParticipants = event.participantsId.length;
        }
        event.save().then(() => {
          done();
        }).catch(err => {
          done(err);
        });
      }
    }).catch(err => {
      done(err);
    }) 
  });

  // queue to update interested stats of event
  // data event object and string of type (up/down)
  kernel.queue.process('INTERESTED_COUNT', (job, done) => {
    kernel.model.Event.findById(job.data.event._id).then(event => {
      if (!event) {
        done({error: 'Event not found'});
      } else {
        let availableType = ['up', 'down'];
        if (availableType.indexOf(job.data.type) !== -1) {
          if (event.stats && event.stats.totalInterested) {
            event.stats.totalInterested = (job.data.type==='up') ? event.stats.totalInterested+1 : event.stats.totalInterested-1;
          } else {
            event.stats = {
              totalInterested: (job.data.type==='up') ? 1 : 0
            }
          }
          if (event.stats.totalInterested < 0) {
            event.stats.totalInterested = 0;
          }
          event.save().then(() => {
            done();
          }).catch(err => {
            done(err);
          });
        } else {
          done({error: 'Type is not valid'});
        }
      }
    }).catch(err => {
      done(err);
    });
  });

  // queue to count total created events of a user
  kernel.queue.process('TOTAL_EVENT_CREATED', (job, done) => {
    kernel.model.User.findById(job.data.userId).then(user => {
      if (!user) {
        done({error: 'User not found'});
      } else {
        if (user.stats) {
          user.stats.totalCreatedEvent = (user.stats.totalCreatedEvent) ? user.stats.totalCreatedEvent+1 : 1;
        } else {
          user.stats = {
            totalCreatedEvent: 1
          }
        }
        user.save().then(() => {
          done();
        }).catch(err => {
          done(err);
        })
      }
    }).catch(err => {
      done(err);
    });
  });

  // queue to count total joined event of a user
  kernel.queue.process('TOTAL_EVENT_JOINED', (job, done) => {
    kernel.model.User.findById(job.data.userId).then(user => {
      if (!user) {
        done({error: 'User not found'});
      } else {
        kernel.model.Event.count({participantsId: user._id}).then(total => {
          if (user.stats) {
            user.stats.totalJoinedEvent = total;
          } else {
            user.stats = {totalJoinedEvent: total};
          }
          user.save().then(() => {
            done();
          }).catch(err => {
            done(err);
          })
        }).catch(err => {
          done(err);
        });
      }
    }).catch(err => {
      done(err);
    });
  });

  // queue to sent email when accepted event have new feed
  /*
  params: new jeed object
  */
  kernel.queue.process('NEW_FEED_ACCEPTED_EVENT', (job, done) => {
    kernel.model.Event.findById(job.data.feed.eventId)
    .populate('participantsId').exec().then(event => {
      let url = kernel.config.baseUrl + 'event/detail/' + event._id;
      async.each(event.participantsId, (user, callback) => {
        kernel.emit('SEND_MAIL', {
          template: 'new-feed.html',
          subject: 'New feed has posted in event ' + event.name,
          data: {
            user: user, 
            feed: job.data.feed,
            url: url
          },
          to: user.email
        });
      }, done);
    }).catch(err => {
      done(err);
    })
  });
};