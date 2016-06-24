import AuthController from './auth.controller';

exports.routes = (kernel) => {
  let controller = new AuthController(kernel);

  kernel.app.post('/api/v1/auth/forgotpw', controller.forgotPw);
  kernel.app.get('/api/v1/auth/forgotpw/checkToken/:token', controller.checkToken, controller.checkPasswordToken);
  kernel.app.post('/api/v1/auth/resetpw', controller.checkToken, controller.resetPassword);
};