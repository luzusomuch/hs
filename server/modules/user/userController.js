'use strict';

import passport from 'passport';
import jwt from 'jsonwebtoken';
import { StringHelper } from '../../kernel/helpers';
import config from '../../config/environment';

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
    req.body.location.coordinates = [106.647800, 10.807084];
    req.body.location.type = 'Point';
    var newUser = new this.kernel.model.User(req.body);
    newUser.provider = 'local';
    newUser.role = 'user';
    newUser.emailVerifiedToken = StringHelper.randomString(10);

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
    this.kernel.model.User.findOne({ _id: req.user._id })
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
    console.log(req.body);
    if (!req.body.token) {
      console.log("AAAAAAAAA");
      return res.status(500).json({message: "Your token is not valid"});
    }
    this.kernel.model.User.findOne({emailVerifiedToken: req.body.token}).then(user => {
      if (!user) {
        console.log("BBBBBBBBBBBB");
        return res.status(500).json({message: "Your token is not valid"});
      }
      if (user.emailVerified) {
        console.log("CCCCCCCCCCCC");
        return res.status(500).json({message: "This user is already verified"});
      }
      this.kernel.model.User.update({_id: user._id}, {$set: {emailVerified: true}}).then(() => {
        return res.status(200).end();
      }).catch(err => {console.log(err); return res.status(500).json(err); });
    }).catch(err => {console.log(err); return res.status(500).json(err); });
  }

  /**
   * Authentication callback
   */
  authCallback(req, res, next) {
    res.redirect('/');
  }
}

module.exports = UserController;