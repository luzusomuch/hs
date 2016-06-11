'use strict';

import crypto from 'crypto';
import mongoose from 'mongoose';
mongoose.Promise = require('bluebird');
import {Schema} from 'mongoose';

var messageThreadSchema = new Schema({
	name: String,
	participants: [{type: Schema.Types.ObjectId, ref: "User", required: true}],
	messages: [{
		user: {type: Schema.Types.ObjectId, ref: "User", required:true},
		message: {type: String, required: true},
		createdAt: Date,
		// we will hide message if deleted is true
		deleted: {type: Boolean, default: false}
	}],
	// we use this to filter, currently we dont know how to get tags. 
	// Need to ask client
	tags: [String],
	createdAt: {type: Date, default: new Date()},
	updatedAt: {type: Date, default: new Date()}
});

messageThreadSchema.pre('save', function(next) {
    this.wasNew = this.isNew;
    if (!this.isNew){
        this.updatedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('MessageThreadModel', messageThreadSchema);