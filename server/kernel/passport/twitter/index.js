'use strict';

import express from 'express';
import passport from 'passport';
import {setTokenCookie} from '../auth.service';

var router = express.Router();

router
  .get('/', passport.authenticate('twitter', {
    failureRedirect: '/register',
    session: false
  }))
  .get('/callback', passport.authenticate('twitter', {
    failureRedirect: '/register',
    session: false
  }), setTokenCookie);

export default router;
