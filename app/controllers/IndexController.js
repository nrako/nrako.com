var form = require('express-form'),
    field = form.field;

form.configure({flashErrors: false});

module.exports = function IndexController(app) {

  app.get('/', function ResumeAction(req, res) {
    res.render('index', { title: 'Home' });
  });

  app.get('/resume', function ResumeAction(req, res) {
    res.render('index', { title: 'Resume' });
  });

  app.get('/about', function AboutAction(req, res) {
    res.render('about', { title: 'About' });
  });

  app.get('/contact', function ContactAction(req, res) {
    res.render('contact', { title: 'Contact' });
  });

  app.post(
    '/contact', 
    form(
      field('headline').trim().required(),
      field('msg').trim().required(),
      field('email').trim().isEmail().required()
    ),
    function ContactAction(req, res) {
      var io = require('../../io');
      var config = require('config');
      var mailer = require('mailer');

      if (!req.form.isValid) {
        var msg = 'Errors : <ul>';
        req.form.errors.forEach(function (sub) {
          msg += '<li>' + sub + '</li>';
        });
        msg += '</ul>';
        req.flash('error', msg);
      } else {
        var email = {
          host:             config.email.smtp,
          port:             config.email.port,
          ssl:              config.email.ssl,
          domain:           config.hostname,
          to:               config.contact.to,
          from:             process.env.EMAIL_USERNAME,
          reply_to:         req.form.email,
          subject:          'Contact Form : ' + req.form.headline,
          body:             req.form.msg,
          authentication:   'login',
          username:         process.env.EMAIL_USERNAME,
          password:         process.env.EMAIL_PWD
        };
        
        if (config.email.disable === true) {
          io.flashMsg('info','Email disabled!');
        } else
          //console.log('send email', email);
          mailer.send(email, function sendContactMailResult(err, result) {
            if (err || !result) {
              console.error(err);
              io.flashMsg('error','Oups! An error occured your message has not been sent! Please try again');
              return;
            }
            
            io.flashMsg('success','Your email has been sent with success!');
          });

        req.flash('info', 'Message received, email confirmation to come in a few seconds...');
      }

      // make use of res.respondTo({}) ? https://github.com/visionmedia/express/blob/master/examples/content-negotiation/index.js
      if (req.isXMLHttpRequest)
        res.json({flash: req.flash()});
      else
        res.render('contact', { title: 'Contact' });
  });
}