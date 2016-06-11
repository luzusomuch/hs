import Joi from 'joi';
import cbToPromise from 'cb-to-promise';

class UserValidator {
	//validate create new data
	static validateCreating(body)  {
		var schema = Joi.object().keys({
	    email: Joi.string().email().required().options({
	    	language: {
	    		key: 'Email '
	    	}
	    }),
	    password: Joi.string().min(6).options({
	    	language: {
	    		key: 'Password ',
	    		string: {
	    			min: 'must be greater than or equal to 6 characters'
	    		}
	    	}
	    }),
	    name: Joi.string().min(2).options({
	    	language: {
	    		key: 'Name ',
	    		string: {
	    			min: 'must be greater than or equal to 2 characters'
	    		}
	    	}
	    })
		});
		return cbToPromise(Joi.validate)(body, schema, {
			stripUnknown: true,
			abortEarly: false
		});
	}

	static validateResetPassword(body)  {
		var schema = Joi.object().keys({
	    password: Joi.string().min(6).required().options({
	    	language: {
	    		key: 'Password ',
	    		string: {
	    			min: 'must be greater than or equal to 6 characters'
	    		}
	    	}
	    }),
	    confirmPassword: Joi.any().valid(Joi.ref('password')).required().options({
	    	language: {
	    		key: 'Confirm Password ',
	    		any: {
	    			allowOnly: 'must be equal to Password'
	    		}
	    	}
	    })
		});
		return cbToPromise(Joi.validate)(body, schema, {
			stripUnknown: true,
			abortEarly: false
		});
	}

	static validateChangePassword(body) {
		var schema = Joi.object().keys({
			currentPassword: Joi.string().min(6).required().options({
	    	language: {
	    		key: 'Current Password ',
	    		string: {
	    			min: 'must be greater than or equal to 6 characters'
	    		}
	    	}
	    }),
	    password: Joi.string().min(6).required().options({
	    	language: {
	    		key: 'Password ',
	    		string: {
	    			min: 'must be greater than or equal to 6 characters'
	    		}
	    	}
	    }),
	    confirmPassword: Joi.any().valid(Joi.ref('password')).required().options({
	    	language: {
	    		key: 'Confirm Password ',
	    		any: {
	    			allowOnly: 'must be equal to Password'
	    		}
	    	}
	    })
		});
		return cbToPromise(Joi.validate)(body, schema, {
			stripUnknown: true,
			abortEarly: false
		});
	}

	static validateUpdating(body)  {
		var schema = Joi.object().keys({
	    firstName: Joi.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/).max(40).options({
	    	language: {
	    		key: 'First Name ',
	    		string: {
	    			regex: {
	    				base : 'must be alphabetic',
	    				name: 'must be alphabetic'
	    			},
	    			max: 'must be less than or equal to 40 characters'
	    		}
	    	}
	    }),
	    lastName: Joi.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/).max(40).options({
	    	language: {
	    		key: 'Last Name ',
	    		string: {
	    			regex: {
	    				base : 'must be alphabetic',
	    				name: 'must be alphabetic'
	    			},
	    			max: 'must be less than or equal to 40 characters'
	    		}
	    	}
	    }),
	    cellPhoneNumber: Joi.string().regex(/^\+[0-9]{8,}$/).options({
	    	language: {
	    		key: 'Cell Phone Number ',
	    		string: {
	    			regex: {
	    				base : 'is invalid',
	    				name: 'is invalid'
	    			}
	    		}
	    	}
	    })
		});
		return cbToPromise(Joi.validate)(body, schema, {
			stripUnknown: true,
			abortEarly: false
		});
	}
}

module.exports = UserValidator;
