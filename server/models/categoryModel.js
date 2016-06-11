'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var CategorySchema = new Schema({
	name: String,
	description: String,
	image: String,
	createdAt: {type: Date, default: new Date()}
});

module.exports = mongoose.model('CategoryModel', CategorySchema);