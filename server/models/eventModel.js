'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var EventSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
	category: {type: Schema.Types.ObjectId, ref: "Category", required: true},
	tags: [String],
	organizer: {type: Schema.Types.ObjectId, ref: "User"},
	awards: [{
		type: Schema.Types.ObjectId, ref: "Award", required: true
	}],
	participants: [{
		type: Schema.Types.ObjectId, ref: "User"
	}],
	photo: [{
		type: Schema.Types.ObjectId, ref: "Photo"
	}],
	likedPeople: [{
		type: Schema.Types.ObjectId, ref: "User"
	}],
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
	public: {type: Boolean, default: true},
	location: {
		lng: Number,
		lat: Number
	},
	repeat: {
		weekly: {type: Boolean, default: false},
		monthly: {type: Boolean, default: false},
		yearly: {type: Boolean, default: false}
	},
	blocked: {type: Boolean, default: false},
	startDateTime: {type: Date, required: true},
	endDateTime: {type: Date, required: true},
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('EventModel', EventSchema);