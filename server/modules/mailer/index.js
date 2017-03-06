import nodemailer from 'nodemailer';
import _ from 'lodash';
import path from 'path';
import mg from 'nodemailer-mailgun-transport';

var viewsPath = './templates/',
  SwigEngine = require('swig').Swig,
  swig = new SwigEngine({
    varControls: ['<%=', '%>'],
    cache : 'memory'
  });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function Mailer(options) {
  this.transport = nodemailer.createTransport(mg(options));
}

Mailer.prototype.render = function(template, options, callback) {
  swig.renderFile(path.join(__dirname, viewsPath, template), options || {}, callback);
};

Mailer.prototype.send = function(options, callback) {
  options = options || {};
  //TODO - pass default value
  // _.defaults(options, {
  //   from : config.emailFrom,
  //   bcc : config.bccEmails || []
  // });

  this.transport.sendMail(options, function(err, data){
    console.log(err);
    console.log(data);
    callback && callback(null, data);
  });
};

Mailer.prototype.sendMail = function(template, emails, options, callback) {
  var self = this;
  self.render(template, options, function(err, output) {

    if (err) { return callback(err); }
    self.send({
      from: 'postmaster@mg.healthstars.online',
      to : emails,
      subject : options.subject,
      html : output
    }, callback);
  });
};

Mailer.prototype.close = function() {
  this.transport.close();
};

let mailer = null;

exports.config = {
  // MAILER: {
  //   host: 'smtp.gmail.com',
  //   port: 587,
  //   secure: false, // use SSL
  //   auth: {
  //     user: 'suportcontest@gmail.com',
  //         pass: 'vqdfloyvrvvxihdu'
  //   }
  // },
  // EMAIL_FROM: 'admin@app.com'


  MAILER: {
    service: 'mailgun',
    auth: {
      api_key: 'key-88d40ded66fc7b48da72f695711c6dd5',
      domain: 'mg.healthstars.online'
    }
  },
  EMAIL_FROM: 'postmaster@mg.healthstars.online'
};

exports.core = (kernel) => {
  mailer = new Mailer(kernel.config.MAILER);

  kernel.mailer = mailer;

  //send mail event
  /**
   * template: 'welcome.html'
   * to: 'abc@xyz.com'
   * subject: 'mail subject'
   * data: 'data to pass email'
   */
  kernel.on('SEND_MAIL', (data) => {
    kernel.queue.create('SEND_MAIL', data).save();
  });

  kernel.queue.process('SEND_MAIL', (job, done) => {
    mailer.sendMail(job.data.template, job.data.to, Object.assign({subject: job.data.subject}, job.data.data), (err) => {
      console.log(err);
      console.log('send mail success');
      done(err);
    });
  });
};