'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var PhotoSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
	blocked: {type: Boolean, default: false},
	metadata: {},
	likedPeople: [{type:Schema.Types.ObjectId, ref: "User", required: true}],
	sharedPeople: [{type: Schema.Types.ObjectId, ref: "User"}],
	comments: [{
		user: {type: Schema.Types.ObjectId, ref: "User", required: true},
		comment: String,
		likedPeople: [{type: Schema.Types.ObjectId, ref: "User"}],
		sharedPeople: [{type: Schema.Types.ObjectId, ref: "User"}],
		subComment: [{
			user: {type: Schema.Types.ObjectId, ref: "User", required: true},
			comment: String,
			likedPeople: [{type: Schema.Types.ObjectId, ref: "User"}],
			sharedPeople: [{type: Schema.Types.ObjectId, ref: "User"}],
			createdAt: {type: Date},
		}],
		createdAt: {type: Date},
	}],
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('PhotoModel', PhotoSchema);