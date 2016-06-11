import nodemailer from 'nodemailer';
import _ from 'lodash';
import path from 'path';
import  config from '../config/environment';

var viewsPath = '../views/emails/',
  SwigEngine = require('swig').Swig,
  swig = new SwigEngine({
    varControls: ['<%=', '%>'],
    cache : 'memory'
  });

function Mailer(options) {
  this.transport = nodemailer.createTransport(options);
}

Mailer.prototype.render = function(template, options, callback) {
  swig.renderFile(path.join(__dirname, viewsPath, template), options || {}, callback);
};

Mailer.prototype.send = function(options, callback) {
  options = options || {};

  _.defaults(options, {
    from : config.emailFrom,
    bcc : config.bccEmails || []
  });

  this.transport.sendMail(options, function(err, data){
    callback && callback(null, data);
  });
};

Mailer.prototype.sendMail = function(template, emails, options, callback) {
  var self = this;
  self.render(template, options, function(err, output) {

    if (err) { return callback(err); }
    self.send({
      to : emails,
      subject : options.subject,
      html : output
    }, callback);
  });
};

Mailer.prototype.close = function() {
  this.transport.close();
};

//export singleton
module.exports = new Mailer(config.mailer);