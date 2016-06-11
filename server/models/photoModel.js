'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var PhotoSchema = new Schema({
	owner: {type: mongoose.Types.ObjectId, ref: "User"},
	blocked: {type: Boolean, default: false},
	metadata: {}
});