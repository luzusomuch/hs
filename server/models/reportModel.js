'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var ReportSchema = new Schema({
	reporter: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	event: {type: Schema.Types.ObjectId, ref: 'Event', required: true},
	user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	type: {type: String, enum: ['user', 'event']},
	comment: {type: String, required: true},
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('ReportModel', ReportSchema);