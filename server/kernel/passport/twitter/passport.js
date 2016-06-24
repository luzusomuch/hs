import passport from 'passport';
import {Strategy as TwitterStrategy} from 'passport-twitter';

export function setup(User, config) {
  passport.use(new TwitterStrategy({
    consumerKey: config.TWITTER.clientID,
    consumerSecret: config.TWITTER.clientSecret,
    callbackURL: config.TWITTER.callbackURL
  },
  function(token, tokenSecret, profile, done) {
    console.log(profile);
    User.findOne({'twitter.id_str': profile.id}).exec()
      .then(user => {
        if (user) {
          return done(null, user);
        }

        user = new User({
          name: profile.displayName,
          username: profile.username,
          role: 'user',
          provider: 'twitter',
          twitter: profile._json
        });
        user.save()
          .then(user => done(null, user))
          .catch(err => done(err));
      })
      .catch(err => done(err));
  }));
}
