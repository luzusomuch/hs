import UserController from './userController';

exports.routes = (kernel) => {
  let userController = new UserController(kernel);

  kernel.app.get('/api/v1/users/me', kernel.middleware.isAuthenticated(), userController.me);
  kernel.app.put('/api/v1/users/profile', kernel.middleware.isAuthenticated(), userController.updateProfile);
  kernel.app.put('/api/v1/users/changeExhibit', kernel.middleware.isAuthenticated(), userController.changeExhibit);
  kernel.app.put('/api/v1/users/:id/password', kernel.middleware.isAuthenticated(), userController.changePassword);
  kernel.app.post('/api/v1/users', userController.create);
  kernel.app.post('/api/v1/users/verify-account', userController.verifyAccount);
  kernel.app.post('/api/v1/users/change-picture', kernel.middleware.isAuthenticated(), userController.changePictrue);
  kernel.app.delete('/api/v1/users/:id', kernel.middleware.hasRole('admin'), userController.destroy);
  kernel.app.get('/api/v1/users', kernel.middleware.hasRole('admin'), userController.index);
  kernel.app.get('/api/v1/users/:id/info', kernel.middleware.isAuthenticated(), userController.info);
  kernel.app.get('/api/v1/users/friends/:page', kernel.middleware.isAuthenticated(), userController.getFriends);
};