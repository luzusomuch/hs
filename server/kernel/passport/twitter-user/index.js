'use strict';

import express from 'express';
import passport from 'passport';
// import {setTokenCookie} from '../auth.service';


var router = express.Router();

router
	.get('/', passport.authenticate('twitter', {
	    session: false
  	}))
  	.get('/currentUser', passport.authenticate('twitter', {
    	session: false
  	}), (req, res) => {
  		console.log(Object.keys(res));
  		console.log(res.req);
  		let profile = res.req.user._json;
  		res.redirect('/api/v1/users/twitter-account?screen_name='+profile.screen_name);
  	});

export default router;
