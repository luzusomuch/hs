'use strict';

import * as helpers from './../../helpers';
import * as jwt from 'jsonwebtoken';
import config from '../../config/environment';


class AuthController {
  constructor(kernel) {
  	this.secret = 'hs-forgot-pass';
    this.kernel = kernel;
    this.model = this.kernel.model;
    this.forgotPw = this.forgotPw.bind(this);
    this.checkToken = this.checkToken.bind(this);
    this.checkPasswordToken = this.checkPasswordToken.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  checkToken (req, res, next) {
	  let decoded;
	  let token = req.params.token || req.body.token;
	  jwt.verify(token, this.secret, function(err, decoded) {
	    if (err) { return res.status(403).json({type: 'TOKEN_INVALID', message: 'Token is invalid or expired'});}
	    decoded = decoded;
	    next();
	  });
	}

  forgotPw(req, res) {
	  if (!helpers.StringHelper.isEmail(req.body.email)) {
	    return res.status(422).json({ type: 'EMAIL_NOT_FOUND', message: 'Email must be a valid email.' });
	  }
	  
	  this.model.User.findOne({email: req.body.email, provider: 'local'}).then(
	  	user => {
	  		if(!user) {
	  			return res.status(404).json({type: 'EMAIL_NOT_FOUND', message: 'This email is not registered'});
	  		}
	  		let token = jwt.sign({id: user._id}, this.secret, { expiresIn: 60 * 60 * 2});
	  		user.set('passwordResetToken', token);
	  		user.save().then(user => {
	  			let baseUrl = config.baseUrl;
	  			let url = baseUrl + 'resetpw/' + user.passwordResetToken;
	  			this.kernel.emit('SEND_MAIL', {
		        template: 'forgotPassword.html',
		        subject: 'Recover email from HealthStars',
		        data: {
		          user: user, 
		          url: url,
		          baseUrl: baseUrl
		        },
		        to: user.email
			    });
			    return res.status(200).json({type: 'FORGOT_PASSWORD_SUCCESS', message: 'Please check your email to reset password'});
	  		}, err => res.status(500).json({type: 'SERVER_ERROR'}))
	  	},
	  	err => res.status(500).json({type: 'SERVER_ERROR'})
	  );
  }

  checkPasswordToken(req, res) {
  	let token = req.params.token;
	  this.model.User.findOne({passwordResetToken: token}).then(
	    user => {
	      if(!user) {
	        return res.status(404).json({type: 'TOKEN_INVALID', message: 'Invalid token'});
	      }
	      return res.status(200).json({id: user._id});
	    },
	    err => {
	     return res.status(500).json({type: 'SERVER_ERROR', message: 'Opp! Something went wrong. Please try again later.'});
	    }
	  );
  }

  resetPassword(req, res) {
  	if(!req.body.password || !req.body.confirmPassword) {
  		return res.status(400).json({type: 'RESET_PASSWORD_BAD_REQUEST', message: 'Password and Confirm Password are requried'});
  	}

  	if(req.body.password !== req.body.confirmPassword) {
  		return res.status(422).json({type: 'CONFIRM_PASSWORD_ERROR', message: 'Confirm password does not match'});
  	}

  	this.model.User.findOne({passwordResetToken: req.body.token}).then(
  		user => {
  			if(!user) {
  				return res.status(403).json({type: 'TOKEN_INVALID', message: 'Token is invalid or expired'});
  			}
  			user.set('password', req.body.password);
  			user.save().then(
  				() => res.status(200).json({type: 'RESET_PASSWORD_SUCCESS'}),
  				err => res.status(500).json({type: 'SERVER_ERROR'})
  			)
  		},
  		err => res.status(500).json({type: 'SERVER_ERROR'})
  	);
  }

}

module.exports = AuthController;