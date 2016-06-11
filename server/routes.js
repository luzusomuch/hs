/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import path from 'path';
import * as auth from './auth/auth.service';
import userController from './api/v1/userController';

export default function(app) {
  // Insert routes below
  app.get('/api/v1/users/me', auth.isAuthenticated(), userController.me);
  app.put('/api/v1/users/:id/password', auth.isAuthenticated(), userController.changePassword);
  app.post('/api/v1/users', userController.create);
  app.delete('/api/v1/users/:id', auth.hasRole('admin'), userController.destroy);
  app.get('/api/v1/users', auth.hasRole('admin'), userController.index);

  app.use('/auth', require('./auth'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets|lib|styles)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get((req, res) => {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
}
