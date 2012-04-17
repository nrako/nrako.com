module.exports = function IndexController(app) {

  app.get('/', function ResumeAction(req, res) {
    require('../../io').sio.sockets.in(req.sessionID).send('Man, good to see you back!');

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

  app.post('/contact', function ContactAction(req, res) {
    
    var io = require('../../io');
    var config = require('config');
    var mailer = require('mailer');

    var email = {
      host:             config.email.smtp,
      port:             config.email.port,
      ssl:              config.email.ssl,
      domain :          config.hostname,
      to:               config.contact.to,
      from:             config.email.username,
      reply_to:         req.body.email,
      subject:          'Contact Form : ' + req.body.headline,
      body:             req.body.msg,
      authentication:   'login',
      username:         config.email.username,
      password:         config.email.pwd
    };
    
    if (config.email.disable === true) {
      console.log('send email', email);
      io.flashMsg('info','Email disabled!');
    } else
      mailer.send(email, function sendContactMailResult(err, result) {
        if (err || !result) {
          console.error(err);
          io.flashMsg('error','Oups! An error occured your message has not been sent! Please try again');
          return;
        }
        
        io.flashMsg('success','Your email has been sent with success!');
      });

    req.flash('info', 'Message received, email confirmation to come in a few seconds...');

    // make use of res.respondTo({}) ? https://github.com/visionmedia/express/blob/master/examples/content-negotiation/index.js
    if (req.isXMLHttpRequest)
      res.json({flash: req.flash()});
    else
      res.render('contact', { title: 'Contact' });
  });

}