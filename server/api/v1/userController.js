'use strict';

import { UserModel } from '../../models';
import { UserBusiness } from '../../businesses';
import { UserValidator, parseJoiError } from '../../validators';
import passport from 'passport';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';

function validationError(res, statusCode) {
  statusCode = statusCode || 422;
  return function(err) {
    res.status(statusCode).json(err);
  }
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

class UserController {
  /**
   * Get list of users
   * restriction: 'admin'
   */
  static index(req, res) {
    return UserBusiness.find()
      .then(users => {
        res.status(200).json(users);
      })
      .catch(handleError(res));
  }

  /**
   * Creates a new user
   */
  static create(req, res, next) {
    UserValidator.validateCreating(req.body).then(data => {
      data.provider = 'local';
      data.role = 'user';

      UserBusiness.create(data).then(function(user) {
        var token = jwt.sign({ _id: user._id }, config.secrets.session, {
          expiresIn: 60 * 60 * 5
        });
        res.json({ token });
      })
      .catch(validationError(res));
    })
    .catch(err => {
      validationError(parseJoiError(err));
    });
  }

  /**
   * Get a single user
   */
  static show(req, res, next) {
    UserBusiness.findOne({_id: req.params.ud})
    .then(user => {
      if (!user) {
        return res.status(404).end();
      }
      res.json(user.profile);
    })
    .catch(err => next(err));
  }

  /**
   * Deletes a user
   * restriction: 'admin'
   */
  static destroy(req, res) {
    return UserBusiness.removeById(req.params.id)
      .then(function() {
        res.status(204).end();
      })
      .catch(handleError(res));
  }

  /**
   * Change a users password
   */
  static changePassword(req, res, next) {
    //TODO - update validator
    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    UserBusiness.findOne({_id: userId})
    .then(user => {
      if (user.authenticate(oldPass)) {
        user.password = newPass;
        return UserBusiness.update()
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
  static me(req, res, next) {
    UserBusiness.findOne({ _id: req.user._id })
    .then(user => { // don't ever give out the password or salt
      if (!user) {
        return res.status(401).end();
      }
      res.json(user);
    })
    .catch(err => next(err));
  }

  /**
   * Authentication callback
   */
  static authCallback(req, res, next) {
    res.redirect('/');
  }
}

module.exports = UserController;