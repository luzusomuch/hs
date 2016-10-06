'use strict';

import passport from 'passport';
import jwt from 'jsonwebtoken';
import { StringHelper } from '../../kernel/helpers';
import config from '../../config/environment';
import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
import multer from 'multer';
import {Strategy as TwitterStrategy} from 'passport-twitter';

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    res.status(statusCode).json(err);
  }
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).json({type: 'SERVER_ERROR'});
  };
}

class UserController {
  constructor(kernel) {
    this.kernel = kernel;

    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
    this.show = this.show.bind(this);
    this.me = this.me.bind(this);
    this.destroy = this.destroy.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.blockUser = this.blockUser.bind(this);
    this.verifyAccount = this.verifyAccount.bind(this);
    this.changeExhibit = this.changeExhibit.bind(this);
    this.authCallback = this.authCallback.bind(this);
    this.info = this.info.bind(this);
    this.getFriends = this.getFriends.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.changePictrue = this.changePictrue.bind(this);
    this.changeNotificationsSetting = this.changeNotificationsSetting.bind(this);
    this.addSocialAccount = this.addSocialAccount.bind(this);
    this.myDashboard = this.myDashboard.bind(this);
    this.hotmailContacts = this.hotmailContacts.bind(this);
  }

  hotmailContacts(req, res) {
    return res.redirect(config.baseUrl+'/profile/');
    // return res.status(200).end();
  }

  /*Block and un-block user*/
  blockUser(req, res) {
    this.kernel.model.User.findById(req.params.id).then(user => {
      if (!user) {
        return res.status(404).end();
      }
      if (user.blocked) {
        user.blocked.status = !user.blocked.status;
        user.blocked.byUserId = (user.blocked.status) ? req.user._id : null;
      } else {
        user.blocked = {
          status: true,
          byUserId: req.user._id
        };
      }
      user.save().then(saved => {
        this.kernel.queue.create('EMAIL_BLOCK_USER', saved._id).save();
        return res.status(200).json({blocked: saved.blocked});
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  }

  /**
   * Get list of users
   * restriction: 'admin'
   */
  index(req, res) {
    let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 10;
    let skip = (page -1) * pageSize;

    let condition = {};
    let query;

    if (req.query.blocked) {
      condition = {'blocked.status': true};
    } else if (!req.query.blocked) {
      condition = {$or: [{'blocked.status': false}, {'blocked.status': null}]};
    }

    if (req.query.searchText) {
      query = this.kernel.model.User.find(condition, '-password -salt').populate('avatar');
    } else {
      query = this.kernel.model.User.find(condition, '-password -salt')
      .populate('avatar')
      .skip(skip)
      .limit(pageSize);
    }
    
    query.exec().then(users => {
      this.kernel.model.User.count(condition).then(count => {
        if (req.query.searchText) {
          let results = [];
          _.each(users, (user) => {
            if (user.name && (user.name.indexOf(req.query.searchText) !== -1 || user.name.toLowerCase().indexOf(req.query.searchText) !== -1)) {
              results.push(user);
            }
          });
          return res.status(200).json({items: results});
        } else {
          return res.status(200).json({items: users, totalItem: count});
        }
      }).catch(handleError(res));
    }).catch(handleError(res));
  }

  /**
   * Creates a new user
   */
  create(req, res) {
    //TODO - add validator layer for that
    var schema = Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().email().required().options({
        language: {
          key: 'Email '
        }
      }),
      password: Joi.string().regex(/^\w*(?=\w*\d)(?=\w*[A-Za-z])\w*$/).min(6).required().options({
        language: {
          key: 'Password ',
          string: {
            min: 'must be greater than or equal to 6 characters',
            regex: 'must have both digit and characters'
          }
        }
      })
    });
    var result = Joi.validate(req.body, schema, {
      stripUnknown: true,
      abortEarly: false,
      allowUnknown: true
    });
    if (result.error) {
      var err = [];
      _.each(result.error.details, (error) => {
        let type;
        switch(error.type) {
          case 'string.email' :
            type = 'EMAIL_INVALID';
            break;
          case 'string.min': 
            type = 'PASSWORD_MIN_LENGTH_ERROR';
            break;
          case 'string.regex': 
            type = 'PASSWORD_PATTERN_ERROR';
            break;
          default:
            break;
        }
        err.push({type: type, path: error.path, message: error.message});
      });
      return res.status(422).json(err);
    }

    req.body.location.type = 'Point';
    var newUser = new this.kernel.model.User(req.body);
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.emailVerifiedToken = StringHelper.randomString(10);
    newUser.deleted.status = false;
    newUser.blocked.status = false;
    newUser.notificationSetting = {
      isVisibleFriendsList: true,
      invitedToEvent: true,
      friendInvitation: true,
      newPost: true
    };
    newUser.isCompanyAccount = false;

    newUser.save()
    .then((user) => {
      var url = config.baseUrl + 'verify/'+user.emailVerifiedToken;
      this.kernel.emit('SEND_MAIL', {
        template: 'welcome.html',
        subject: 'Welcome to Health Stars',
        data: {
          user: user, 
          url: url
        },
        to: user.email
      });
      var token = jwt.sign({ _id: user._id }, this.kernel.config.SECRETS.session, {
        expiresIn: 60 * 60 * 5
      });
      this.kernel.queue.create(this.kernel.config.ES.events.CREATE, {type: this.kernel.config.ES.mapping.userType, id: user._id.toString(), data: user}).save();
      // if registered user request to be a company account
      if (req.body.isCompanyAccount) {
        this.kernel.model.CompanyAccountRequest({
          ownerId: user._id
        }).save().then(() => {
          res.json({ token });
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      } else {
        res.json({ token });
      }
    }).catch(err => {
      return res.status(500).json(err);
    });
  }

  changePictrue(req, res) {
    let storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.kernel.config.tmpPhotoFolder)
      },
      filename: (req, file, cb) => {
        return cb(null, req.user._id+'_'+ StringHelper.randomString(10) +'_'+file.originalname);
      }
    });
    let upload = multer({
      storage: storage
    }).single('file');

    upload(req, res, (err) => {
      if (err) {return res.status(500).json({type: 'SERVER_ERROR'});}
      if (!req.file || !req.body.type) {
        return res.status(422).end();
      }

      let availableType = ['avatar', 'coverPhoto'];
      if (availableType.indexOf(req.body.type) === -1) {
        return res.status(422).end();
      }
      this.kernel.model.Photo({
        ownerId: req.user._id,
        metadata: {
          tmp: req.file.filename
        }
      }).save().then(photo => {
        this.kernel.queue.create('PROCESS_AWS', photo).save();
        let user = req.user;
        user[req.body.type] = photo._id;
        user.save().then(() => {
          return res.status(200).json({type: req.body.type, photo: photo});
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});
      });
    });
  }

  /**
   * Get a single user
   */
  show(req, res, next) {
    this.kernel.model.User.findOne({_id: req.params.ud})
    .then(user => {
      if (!user) {
        return res.status(404).json({type: 'EMAIL_NOT_FOUND', message: 'This email is not registered'});
      }

      res.json(user.profile);
    })
    .catch(err => next(err));
  }

  /**
   * Deletes a user
   * restriction: 'admin'
   */
  destroy(req, res) {
    this.kernel.model.User.findById(req.params.id).then(user => {
      // Not allow to delete admin user
      if (user.role==='admin') {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      if (req.user._id.toString()===user._id.toString() || req.user.role==='admin') {
        user.deleted.status = true;
        user.deleted.byUserId = req.user._id;
        user.save().then(() => {
          return res.status(200).end();
        }).catch(err => {
          return res.status(500).json({type: 'SERVER_ERROR'});
        });
      } else {
        return res.status(403).end();
      }
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    })
  }

  /**
   * Change a users password
   */
  changePassword(req, res, next) {
    //TODO - update validator
    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    this.kernel.model.User.findOne({_id: userId})
    .then(user => {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return user.save()
          .then(() => {
            res.status(204).end();
          })
          .catch(validationError(res));
      } else {
        return res.status(403).end();
      }
    });
  }

  /**
   * Get my info
   */
  me(req, res, next) {
    this.kernel.model.User.findOne({ _id: req.user._id }, '-salt -password')
    .populate({
      path: 'awardsExhibits.awardId',
      populate: {path: 'objectPhotoId', model: 'Photo'}
    })
    .populate('avatar')
    .populate('coverPhoto')
    .then(user => { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }
      user.lastAccess = new Date();
      user.save().then(() => {
        res.json(user);
      }).catch(err => {
        next(err);
      });
    }).catch(err => next(err));
  }

  /*
  verify account
  */
  verifyAccount(req, res) {
    if (!req.body.token) {
      return res.status(500).json({message: "Your token is not valid"});
    }
    this.kernel.model.User.findOne({emailVerifiedToken: req.body.token}).then(user => {
      if (!user) {
        return res.status(500).json({message: "Your token is not valid"});
      }
      if (user.emailVerified) {
        return res.status(500).json({message: "This user is already verified"});
      }
      this.kernel.model.User.update({_id: user._id}, {$set: {emailVerified: true}}).then(() => {
        return res.status(200).end();
      }).catch(err => {return res.status(500).json(err); });
    }).catch(err => {return res.status(500).json(err); });
  }

  /*Update profile*/
  updateProfile(req, res) {
    if (!req.body) {
      return res.status(422).end();
    }
    // Validate
    var schema = Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().email().required().options({
        language: {
          key: 'Email '
        }
      })
    });
    var result = Joi.validate(req.body, schema, {
      stripUnknown: true,
      abortEarly: false,
      allowUnknown: true
    });
    if (result.error) {
      var err = [];
      _.each(result.error.details, (error) => {
        let type;
        switch(error.type) {
          case 'string.email' :
            type = 'EMAIL_INVALID';
            break;
          case 'string.min': 
            type = 'PASSWORD_MIN_LENGTH_ERROR';
            break;
          default:
            break;
        }
        err.push({type: type, path: error.path, message: error.message});
      });
      return res.status(422).json(err);
    }
    this.kernel.model.User.findById(req.params.id).then(user => {
      if (!user) {
        return res.status(404).end();
      }
      let companyAccount = _.clone(user).isCompanyAccount;

      user.name = req.body.name;
      user.phoneNumber = req.body.phoneNumber;
      user.location = req.body.location;
      user.location.type = 'Point';
      user.email = req.body.email;
      user.isCompanyAccount =  (req.body.isCompanyAccount && companyAccount) ? true : false;

      if (req.user.role==='admin' && req.body.role) {
        user.role = req.body.role;
      }

      user.save().then(() => {
        // if updated user request to change to company account
        if (req.body.isCompanyAccount && !companyAccount) {
          this.kernel.model.CompanyAccountRequest.findOne({ownerId: user._id}).then(request => {
            if (!request) {
              this.kernel.model.CompanyAccountRequest({
                ownerId: user._id
              }).save().then(() => {
                return res.status(200).json({isCompanyAccount: user.isCompanyAccount});
              }).catch(err => {
                return res.status(500).json({type: 'SERVER_ERROR'});
              });
            } else {
              return res.status(200).json({isCompanyAccount: user.isCompanyAccount});
            }
          }).catch(err => {
            return res.status(500).json({type: 'SERVER_ERROR'});
          });
        } else {
          return res.status(200).json({isCompanyAccount: user.isCompanyAccount});
        }
      }).catch(() => {
        return res.status(500).json({type: 'SERVER_ERROR'});
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  }

  /*
  change exhibit awards
  */
  changeExhibit(req, res) {
    if (!req.body.rank || !req.body.awardId) {
      return res.status(422).json({type: 'MISSING_RANK_OR_AWARD', message: 'Missing rank or award'});
    }
    this.kernel.model.User.findById(req.user._id).then(user => {
      if (!user) {
        return res.status(404).end();
      }
      let index = _.findIndex(user.awardsExhibits, (award) => {
        return award.number === req.body.rank;
      });
      if (index !== -1) {
        user.awardsExhibits[index].awardId = req.body.awardId;
      } else {
        user.awardsExhibits.push({number: Number(req.body.rank), awardId: req.body.awardId});
      }
      if (req.body.swapAwardId && req.body.swapRank) {
        let idx = _.findIndex(user.awardsExhibits, (award) => {
          return award.number === req.body.swapRank;
        });
        if (idx !== -1) {
          user.awardsExhibits[idx].awardId = req.body.swapAwardId;
        }
      }
      user.save().then(data => {
        this.kernel.model.User.populate(data, [{
          path: 'awardsExhibits.awardId',
          populate: {path: 'objectPhotoId', model: 'Photo'}
        }], (err) => {
          if (err) {
            return res.status(500).json({type: 'SERVER_ERROR'});      
          }
          return res.status(200).json(data);
        });
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});  
      });
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  }

  /* Get user info */
  info(req, res) {
    if(!this.kernel.mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({type: 'BAD_REQUEST'});
    }
    this.kernel.model.User.findById(req.params.id, '-password -salt')
    .populate('avatar')
    .populate('coverPhoto')
    .then(user => {
      if(!user) {
        return res.status(400).json({type: 'NOT_FOUND'});
      }
      async.parallel([
        (cb) => {
          // count award here
          cb(null, 0);
        },
        (cb) => {
          // count event
          this.kernel.model.Event.count({
            ownerId: user.id,
            blocked: false,
            $or : [
              { private : false },
              { private : { $exists: false } }
            ]
          }, cb);
        },
        (cb) => {
          // count follwers
          this.kernel.model.Relation.count({
            toUserId: user.id,
            type: 'follow'
          }, cb);        
        },
        (cb) => {
          // get user exhibit awards
          async.each(user.awardsExhibits, (award, callback) => {
            this.kernel.model.Award.findById(award.awardId)
            .populate('objectPhotoId')
            .exec().then(aw => {
              if (!aw) {return callback({error: 'Award not found'});}
              award.awardId = aw;
              callback();
            }).catch(callback);
          }, cb);
        },
        (cb) => {
          // Check selected user and current user is friend or not
          this.kernel.model.Relation.findOne({
            type: 'friend', 
            $or: [{
              fromUserId: req.params.id, 
              toUserId: req.user._id
            }, {
              fromUserId: req.user._id, 
              toUserId: req.params.id
            }]
          }).then(friend => {
            if (!friend) {
              cb(null, 'none');
            } else {
              cb(null, friend.status);
            }
          }).catch(cb);
        },
        (cb) => {
          this.kernel.model.Relation.findOne({
            type: 'follow', 
            $or: [{
              fromUserId: req.params.id, 
              toUserId: req.user._id
            }, {
              fromUserId: req.user._id, 
              toUserId: req.params.id
            }]
          }).then(friend => {
            if (!friend) {
              cb(null, 'none');
            } else {
              cb(null, friend.status);
            }
          }).catch(cb);
        }
      ], (err, result) => {
        if(err) {
          return res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)}); 
        }
        let data = user.toJSON();
        data.awards = result[0];
        data.posts = result[1];
        data.followers = result[2];
        data.isFriend = result[4];
        data.isFollow = result[5];
        return res.status(200).json(data);
      });
    }, err => res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)}))
  }

  getFriends(req, res) {
    let page = req.params.page || 1;
    let limit = 20;
    async.waterfall([
      (cb) => {
        this.kernel.model.Relation.find({
          $or: [
            { fromUserId: req.params.id },
            { toUserId: req.params.id }
          ],
          type: 'friend',
          status: 'completed'
        }, (err, result) => {
          if(err) return cb(err);
          let friendIds = _.union(_.map(result, 'fromUserId'), _.map(result, 'toUserId'));
          // get uniq friends id
          friendIds = _.map(_.groupBy(friendIds,function(doc){
            return doc;
          }),function(grouped){
            return grouped[0];
          });
          // remove req user from friend list
          let idx = _.findIndex(friendIds, (id) => {
            return id.toString()===req.params.id.toString();
          });
          if (idx !== -1) {
            friendIds.splice(idx, 1);
          }
          return cb(null, friendIds);
        });
      },

      (friendIds, cb) => {
        if(!friendIds.length) {
          return cb(null, []);
        }
        let query;
        // We use get all query when create new thread message on my messages page
        if (req.query.getAll) {
          query = this.kernel.model.User.find({
            _id: { $in: friendIds}
          }, '-salt -password')
          .populate('avatar')
        } else {
          query = this.kernel.model.User.find({
            _id: { $in: friendIds}
          }, '-salt -password')
          .populate('avatar')
          .limit(limit)
          .skip((page-1)*limit)
        }
        
        query.exec().then(friends => {
          let results = [];
          async.each(friends, (friend, callback) => {
            friend = friend.toJSON();
            this.kernel.model.Relation.findOne({
              type: 'friend',
              $or: [{
                fromUserId: req.user._id, toUserId: friend._id
              }, {
                fromUserId: friend._id, toUserId: req.user._id
              }]
            }).then(relation => {
              if (!relation) {
                friend.currentFriendStatus = 'none';
                results.push(friend);
                return callback(null);
              }
              friend.currentFriendStatus = relation.status;
              results.push(friend);
              callback(null);
            }).catch(callback);
          }, (err) => {
            if (err) {
              return res.status(500).json({type: 'SERVER_ERROR'});
            }
            this.kernel.model.User.count({_id: {$in: friendIds}}).then(count => {
              cb(null, {items: results, totalItem: count});
            }).catch(cb);
          });
        }).catch(cb);
      }
    ], (err, friends) => {
      if(err) return res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)});
      this.kernel.model.User.findById(req.params.id).then(user => {
        if (!user) {
          return res.status(404).end();
        }
        // If user set visible friends list and the selected user isn't a current user then hide all
        if (user.notificationSetting && user.notificationSetting.isVisibleFriendsList && req.user._id.toString()!==user._id.toString()) {
          return res.status(200).json({items: [], totalItem: 0});
        }
        return res.status(200).json(friends);
      }).catch(err => {
        if (err) {
          return res.status(500).json({type: 'SERVER_ERROR', message: err});
        }
      });
    });
  }

  changeNotificationsSetting(req, res) {
    if (!req.body.type) {
      return res.status(422).end();
    }
    let user = req.user;
    if (!user.notificationSetting) {
      user.notificationSetting = {};
      user.notificationSetting[req.body.type] = true;
    } else {
      user.notificationSetting[req.body.type] = !user.notificationSetting[req.body.type];
    }

    user.save().then(saved => {
      return res.status(200).json(saved);
    }).catch(err => {
      return res.status(500).json({type: 'SERVER_ERROR'});
    });
  }

  /*Add social account to current user*/
  addSocialAccount(req, res) {
    let validAccountType = ['google', 'twitter', 'facebook'];
    if (validAccountType.indexOf(req.body.type) !== -1) {
      let user = req.user;
      user[req.body.type] = req.body.data;
      user.save().then(() => {
        return res.status(200).end();
      }).catch(err => {
        return res.status(500).json({type: 'SERVER_ERROR'});
      })
    } else {
      return res.status(442).end();
    }
  }

  /*Get my dashboard*/
  myDashboard(req, res) {
    let user = req.user;
    let page = req.query.page || 1;
    let pageSize = req.query.pageSize || 5;
    let skip = pageSize * (page-1);
    let results = [];
    let totalItem = 0;
    async.parallel([
      (cb) => {
        // Display feeds from friends
        this.kernel.model.Relation.find({
          status: 'completed',
          type: 'friend',
          $or: [{toUserId: req.user._id}, {fromUserId: req.user._id}]
        }).then(relations => {
          async.each(relations, (relation, callback) => {
            let id = (relation.fromUserId.toString()===req.user._id.toString()) ? relation.toUserId : relation.fromUserId;
            this.kernel.model.User.findById(id, '-password -salt').populate('avatar').then(user => {
              if (!user) {
                return callback(null);
              }
              this.kernel.model.Like.find({ownerId: id, objectName: 'Event'}).then(likes => {
                async.each(likes, (like, _callback) => {
                  like = like.toJSON();
                  like.itemType = 'liked';
                  like.ownerId = user;
                  this.kernel.model[like.objectName].findById(like.objectId)
                  .populate('photosId')
                  .exec().then(data => {
                    like.event = data;
                    results.push(like);
                    _callback(null);
                  }).catch(_callback);
                }, callback);                  
              }).catch(callback);
            }).catch(callback);
          }, cb);
        }).catch(cb);
      },
      (cb) => {
        // Invited friends list
        this.kernel.model.Relation.find({
          type: 'friend', 
          status: 'pending', 
          toUserId: user._id
        })
        .populate({
          path: 'fromUserId', 
          select: '-password -salt',
          populate: {path: 'avatar', model: 'Photo'}
        })
        .exec().then(relations => {
          _.each(relations, (relation) => {
            relation = relation.toJSON();
            relation.itemType = 'relation';
            results.push(relation);
          });
          cb(null);
        }).catch(cb);
      },
      (cb) => {
        // Get friends
        this.kernel.model.Relation.find({
          status: 'completed',
          type: 'friend',
          $or: [{toUserId: req.user._id}, {fromUserId: req.user._id}]
        }).then(relations => {
          async.each(relations, (relation, _callback) => {
            let id = (relation.fromUserId.toString()===req.user._id.toString()) ? relation.toUserId : relation.fromUserId;
            let query = {
              query: {
                filtered: {
                  query: {
                    bool: {
                      should: []
                    }
                  },
                  filter: {
                    bool: {
                      must: [
                        { term: { blocked: false } },
                        { term: { private: false } },
                      ],
                      should: [
                        { term: { attendedIds: id}}
                      ]
                    }
                  }
                }
              } 
            };
            this.kernel.ES.search(query, this.kernel.config.ES.mapping.eventType, (err, result) => {
              if (err) {
                return _callback(err);
              }
              this.kernel.model.User.findById(id, '-password -salt')
              .populate('avatar').exec().then(user => {
                async.each(result.items, (item, callback) => {
                  this.kernel.model.Event.findById(item._id)
                  .populate('photosId').exec().then(event => {
                    if (!event) {
                      callback(null);
                    } else {
                      event = event.toJSON();
                      event.ownerId = user;
                      event.itemType = 'upcoming-event';
                      results.push(event);
                      callback(null);
                    }
                  }).catch(callback);
                }, _callback);
              }).catch(_callback);
            });
          }, cb);
        }).catch(cb);
      },
      (cb) => {
        // Events invited list
        this.kernel.model.InvitationRequest.find({toUserId: user._id})
        .sort({createdAt: -1})
        .limit(pageSize)
        .skip(skip).exec().then(data => {
          async.each(data, (item, callback) => {
            this.kernel.model.Event.findById(item.objectId)
            .populate({
              path: 'ownerId', 
              select: '-password -salt',
              populate: {path: 'avatar', model: 'Photo'}
            })
            .populate('photosId')
            .exec().then(event => {
              if (!event) {
                callback(null);
              } else {
                event = event.toJSON();
                event.itemType = 'event-invited';
                event.createdAt = item.createdAt;
                event.inviteId = item._id;
                results.push(event);
                callback(null);
              }
            }).catch(callback);
          }, cb);
        }).catch(cb);
      },
      (cb) => {
        //get user has attend event's current user that created
        this.kernel.model.Event.find({ownerId: req.user._id}).populate('photosId').then(events => {
          async.each(events, (event, callback) => {
            this.kernel.model.AttendEvent.findOne({eventId: event._id})
            .populate({
              path: 'ownerId', 
              select: '-password -salt',
              populate: {
                path: 'avatar', model: 'Photo'
              }
            }).exec().then(attend => {
              if (!attend) {
                return callback();
              }
              attend = attend.toJSON();
              attend.itemType = 'attend-event';
              attend.event = event;
              results.push(attend);
              callback();
            }).catch(callback);
          }, cb);
        }).catch(cb);
      }, 
      (cb) => {
        this.kernel.model.Event.find({participantsId: req.user._id})
        .populate('photosId')
        .populate({
          path: 'ownerId',
          select: '-password -salt',
          populate: {path: 'avatar', model: 'Photo'}
        }).then(events => {
          async.each(events, (event, callback) => {
            if (_.findIndex(event.participantsId, (id) => {
              return id.toString()===req.user._id.toString();
            }) !== -1 && _.findIndex(event.attendedIds, (id) => {
              if (id) {
                return id.toString()===req.user._id.toString();
              }
            }) === -1) {
              event = event.toJSON();
              event.itemType = 'inviting-event';
              results.push(event);
              callback();
            } else {
              callback();
            }
          }, cb);
        }).catch(cb);
      }
    ], (err) => {
      if (err) {
        return res.status(500).json({type: 'SERVER_ERROR'});
      }
      results = _.sortBy(results, (item) => {
        return item.createdAt;
      });
      return res.status(200).json({items: results.reverse(), totalItem: results.length});
    });
  }

  /**
   * Authentication callback
   */
  authCallback(req, res, next) {
    res.redirect('/');
  }
}

module.exports = UserController;