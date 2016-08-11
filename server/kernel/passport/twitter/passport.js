import passport from 'passport';
import {Strategy as TwitterStrategy} from 'passport-twitter';

export function setup(User, config) {
  passport.use(new TwitterStrategy({
    consumerKey: config.TWITTER.clientID,
    consumerSecret: config.TWITTER.clientSecret,
    callbackURL: config.TWITTER.callbackURL
  },
  function(token, tokenSecret, profile, done) {
    User.findOne({'twitter.id_str': profile.id}).exec()
      .then(user => {
        if (user) {
          if (user.deleted && user.deleted.status) {
            return done(null, false, {
              message: 'This user was deleted',
              error: 'USER_DELETED'
            });
          } else if (user.blocked && user.blocked.status) {
            return done(null, false, {
              message: 'This email was blocked',
              error: 'EMAIL_BLOCKED'
            });
          }
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
