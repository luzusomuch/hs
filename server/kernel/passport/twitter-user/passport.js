import passport from 'passport';
import {Strategy as TwitterStrategy} from 'passport-twitter';

export function setup(User, config) {
  	passport.use(new TwitterStrategy({
	    consumerKey: config.TWITTER_CURRENT_USER.clientID,
	    consumerSecret: config.TWITTER_CURRENT_USER.clientSecret,
	    callbackURL: config.TWITTER_CURRENT_USER.callbackURL
  	},
  	function(token, tokenSecret, profile, done) {
  		done(null, profile);
  	}));
}
