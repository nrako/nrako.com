
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'),
  url = require('url'),
  forms = require('./forms'),
  stylus = require('stylus'),
  SendGrid = require('sendgrid').SendGrid,
  ESHQ = require('eshq-js');

var app = express();

var sendgrid = global.sendgrid = new SendGrid(
  process.env.SENDGRID_USERNAME,
  process.env.SENDGRID_PASSWORD
);

var eshq = global.eshq = new ESHQ({
  key: process.env.ESHQ_KEY,
  secret: process.env.ESHQ_SECRET
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  // set view helpers
  app.use(function setViewHelpers(req, res, next) {
    // expose current pathname
    res.locals.path = url.parse(req.url).pathname;
    next();
  });
  app.use(express.favicon());
  app.use(express.logger('dev'));
  eshq.listen(app);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(stylus.middleware({
    src: __dirname + '/public',
    compile: function(str, path) {
      return stylus(str)
        .set('filename', path)
        .set('compress', true)
        .use(require('nib')());
    }
  }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(req, res, next){
    res.render('404', { title: '404 - Page Not Found' }, function(err, page) {
      res.send(page, 404);
    });
  });
});

eshq.open({
  channel: 'messages'
}, function(res){
  console.log("channel is ready", arguments);
});

app.configure('development', function(){
  // buggy :( require('console-trace')({always: true});
  app.locals.pretty = true;
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/', forms.contact, routes.contact);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
