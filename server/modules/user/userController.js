'use strict';

import passport from 'passport';
import jwt from 'jsonwebtoken';
import { StringHelper } from '../../kernel/helpers';
import config from '../../config/environment';
import Joi from 'joi';
import _ from 'lodash';
import async from 'async';
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
    this.verifyAccount = this.verifyAccount.bind(this);
    this.authCallback = this.authCallback.bind(this);
    this.info = this.info.bind(this);
  }

  /**
   * Get list of users
   * restriction: 'admin'
   */
  index(req, res) {
    //TODO - handle search params
    return this.kernel.model.User.find()
      .then(users => {
        res.status(200).json(users);
      })
      .catch(handleError(res));
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
      res.json({ token });
    })
    .catch(handleError(res));
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
    return this.kernel.model.User.removeById(req.params.id)
      .then(function() {
        res.status(204).end();
      })
      .catch(handleError(res));
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
        return this.kernel.model.User.update()
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
    .then(user => { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }
      res.json(user);
    })
    .catch(err => next(err));
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

  info(req, res) {
    if(!this.kernel.mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({type: 'BAD_REQUEST'});
    }
    this.kernel.model.User.findById(req.params.id, '-password -salt')
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
        }
      ], (err, result) => {
        if(err) {
          return res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)}); 
        }
        let data = user.toJSON();
        data.awards = result[0];
        data.posts = result[1];
        data.followers = result[2];
        return res.status(200).json(data);
      });
    }, err => res.status(500).json({type: 'SERVER_ERROR', message: JSON.stringify(err)}))
  }

  /**
   * Authentication callback
   */
  authCallback(req, res, next) {
    res.redirect('/');
  }
}

module.exports = UserController;