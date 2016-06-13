'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var DeviceSchema = new Schema({
	user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	platform: {type: String, required: true},
	token: {type: String, required: true},
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('DeviceModel', DeviceSchema);