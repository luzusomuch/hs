import { UserModel } from '../models';
import { UserEvent } from '../events';
import keys from '../config/keys';

class UserBusiness {
  /**
   * create a new user
   * @param  {Object} data user data
   * @return {Promise}
   */
  static create(data) {
    var newUser = new UserModel(data);
    return newUser.save().then((user) => {
      //fire event to another sides
      UserEvent.emit(keys.USER_CREATED, user);

      return user;
    });
  }

  /**
   * update user
   * @param  {Object} Mongoose user object
   * @return {Promise}
   */
  static update(user) {
    return user.save().then((updated) => {
      UserEvent.emit(keys.USER_UPDATED, updated);

      return updated;
    });
  }

  /**
   * Update all data by query
   * @param  {Object} data user data
   * @return {Promise}
   */
  static updateByQuery(params) {
    //TODO - code me
    let promise = new Promise((resolve, reject) => {
      resolve(true);
    });

    return Promise;
  }

  /**
   * find list of users
   * @param  {Object} params Mongo query
   * @return {Promise}
   */
  static find(params) {
    params = params || {};
    return UserModel.find(params, '-salt -password').exec();
  }

  /**
   * find single record by params
   * @param  {Object} params Mongo query
   * @return {Promise}
   */
  static findOne(params) {
    return UserModel.findOne(params, '-salt -password').exec();
  }

  /**
   * delete account & fire delete event
   * @param  {String} id
   * @return {Promise}
   */
  static removeById(id) {
    return UserModel.findByIdAndRemove(id).exec()
    .then(() => {
      UserEvent.emit(keys.USER_DELETED, id);

      return true;
    });
  }
}

module.exports = UserBusiness;