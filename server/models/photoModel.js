'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var PhotoSchema = new Schema({
	owner: {type: Schema.Types.ObjectId, ref: "User", required: true},
	blocked: {type: Boolean, default: false},
	metadata: {},
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('PhotoModel', PhotoSchema);