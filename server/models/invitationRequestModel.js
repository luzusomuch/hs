'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var InvitationRequestSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
	fromUser: {type: Schema.Types.ObjectId, ref: "User", required: true},
	message: String,
	type: {type: String, enum: ["friend", "event"]},
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('InviationRequestModel', InvitationRequestSchema);