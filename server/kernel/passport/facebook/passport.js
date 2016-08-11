import passport from 'passport';
import {Strategy as FacebookStrategy} from 'passport-facebook';

export function setup(User, config) {
  passport.use(new FacebookStrategy({
    clientID: config.FACEBOOK.clientID,
    clientSecret: config.FACEBOOK.clientSecret,
    callbackURL: config.FACEBOOK.callbackURL,
    profileFields: [
      'displayName',
      'emails'
    ]
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOne({'facebook.id': profile.id}).exec()
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
          provider: 'facebook',
          facebook: profile._json
        });
        user.save()
          .then(user => done(null, user))
          .catch(err => done(err));
      })
      .catch(err => done(err));
  }));
}
