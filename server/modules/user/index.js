import UserController from './userController';
import passport from 'passport';

exports.routes = (kernel) => {
  let userController = new UserController(kernel);
  
  kernel.app.get('/api/v1/users/hotmail-contacts', userController.hotmailContacts);
  kernel.app.get('/api/v1/users/user-location-weather', userController.getUserLocationWeather);
  kernel.app.get('/api/v1/users/me', kernel.middleware.isAuthenticated(), userController.me);
  kernel.app.get('/api/v1/users/my-dashboard', kernel.middleware.isAuthenticated(), userController.myDashboard);
  
  kernel.app.put('/api/v1/users/changeExhibit', kernel.middleware.isAuthenticated(), userController.changeExhibit);
  kernel.app.put('/api/v1/users/notifications-setting', kernel.middleware.isAuthenticated(), userController.changeNotificationsSetting);
  kernel.app.put('/api/v1/users/add-social-account', kernel.middleware.isAuthenticated(), userController.addSocialAccount);
  kernel.app.put('/api/v1/users/change-language', kernel.middleware.isAuthenticated(), userController.changeLanguage);
  kernel.app.put('/api/v1/users/:id/profile', kernel.middleware.isAuthenticated(), userController.updateProfile);
  kernel.app.put('/api/v1/users/:id/password', kernel.middleware.isAuthenticated(), userController.changePassword);
  kernel.app.put('/api/v1/users/:id/block', kernel.middleware.hasRole('admin'), userController.blockUser);
  kernel.app.put('/api/v1/users/:id/update-user-location', kernel.middleware.isAuthenticated(), userController.updateUserLocation);
  kernel.app.put('/api/v1/users/:id/update-user-popup-star-info-status', kernel.middleware.isAuthenticated(), userController.updateUserPopupStarInfoStatus);

  kernel.app.post('/api/v1/users', userController.create);
  kernel.app.post('/api/v1/users/check-email-in-used', userController.checkEmailInUsed);
  kernel.app.post('/api/v1/users/verify-account', userController.verifyAccount);
  kernel.app.post('/api/v1/users/change-picture', kernel.middleware.isAuthenticated(), userController.changePictrue);

  kernel.app.delete('/api/v1/users/:id', kernel.middleware.isAuthenticated(), userController.destroy);

  kernel.app.get('/api/v1/users', kernel.middleware.hasRole('admin'), userController.index);
  kernel.app.get('/api/v1/users/:id/info', kernel.middleware.isAuthenticated(), userController.info);
  kernel.app.get('/api/v1/users/:id/friends/:page', kernel.middleware.isAuthenticated(), userController.getFriends);
};