import passport from 'passport';
import {Strategy as GoogleStrategy} from 'passport-google-oauth20';

export function setup(User, config) {
  passport.use(new GoogleStrategy({
    clientID: config.GOOGLE.clientID,
    clientSecret: config.GOOGLE.clientSecret,
    callbackURL: config.GOOGLE.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({'google.id': profile.id}).exec()
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
          email: profile.emails[0].value,
          role: 'user',
          username: profile.emails[0].value.split('@')[0],
          provider: 'google',
          google: profile._json
        });
        user.save()
          .then(user => done(null, user))
          .catch(err => done(err));
      })
      .catch(err => done(err));
  }));
}
