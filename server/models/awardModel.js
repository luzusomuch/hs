'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var AwardSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	name: {type: String, required: true},
	description: String,
	photo: {type: Schema.Types.ObjectId, ref: 'Photo'},
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('AwardModel', AwardSchema);