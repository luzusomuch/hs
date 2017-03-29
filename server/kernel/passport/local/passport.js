import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

function localAuthenticate(User, email, password, done) {
  User.findOne({
    email: email.toLowerCase()
  }).exec()
    .then(user => {
      if (!user) {
        return done(null, false, {
          message: 'This email is not registered.',
          error: 'SIGN_IN_ERROR'
        });
      }
      user.authenticate(password, function(authError, authenticated) {
        if (authError) {
          return done(authError);
        }
        if (!authenticated) {
          return done(null, false, { message: 'This password is not correct.', error: 'SIGN_IN_ERROR' });
        } else if (user.blocked && user.blocked.status) {
          return done(null, false, {
            message: 'This email was blocked',
            error: 'EMAIL_BLOCKED'
          });
        } else if (user.deleted && user.deleted.status) {
          return done(null, false, {
            message: 'This user was deleted',
            error: 'USER_DELETED'
          });
        } else if (!user.emailVerified) {
          return done(null, false, {
            message: 'Please verify your email address',
            error: 'PLEASE_VERIFY_YOUR_EMAIL_ADDRESS'
          });
        } else {
          return done(null, user);
        }
      });
    })
    .catch(err => done(err));
}

export function setup(User, config) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password' // this is the virtual field on the model
  }, function(email, password, done) {
    return localAuthenticate(User, email, password, done);
  }));
}
