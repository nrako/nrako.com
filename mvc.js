
var express = require('express'),
    fs = require('fs'),
    MemoryStore = express.session.MemoryStore,
    sessionStore = new MemoryStore({ reapInterval: 600 * 1000 });

var config = require('config');

exports.boot = function boot(app) {
  bootApplication(app);
  bootControllers(app);

};
exports.sessionStore = sessionStore;

function bootApplication(app) {
  var stylus = require('stylus');
  var nib = require('nib');
  var url = require('url');


  app.configure(function appConfigure() {

    // views
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');
    app.set('view options', {
      pretty: true, 
      layout: 'layouts/default.jade'});

    // set view helpers
    app.use(function setViewHelpers(req, res, next) {
      // expose current pathname
      res.local('path', url.parse(req.url).pathname);

      next();
    });
    
    // bodyParser
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    // sessions
    app.use(express.cookieParser());
    // TODO use connect-mongo for shared session or maybe redis?
    app.use(express.session({store: sessionStore, secret: config.session.secret, key: 'express.sid' }));

    // stylus
    var stylusCompile = function stylusCompile(str, path) {
      return stylus(str)
        .set('filename', path)
        //.set('warn', true)
        .set('compress', false)
        .use(nib())
        .import('nib');
    };
    app.use(stylus.middleware({ 
      src: __dirname + '/public', 
      compile: stylusCompile }));

    app.use(express.favicon())

    app.use(app.router);
    app.use(express.static(__dirname + '/public'));

    // Some dynamic view helpers
    app.dynamicHelpers({
      /*
      request: function(req){
        return req;
      },
      */
      hasMessages: function(req){

        if (!req.session) return false;
        return Object.keys(req.session.flash || {}).length;
      },

      messages: function(req){
        return function(){
          return req.flash();
        }
      }
    });

  });

  app.set('showStackError', false)
  
  app.configure('development', function appDevConfigure() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });
  
  app.configure('production', function appProdConfigure() {
    app.use(express.errorHandler());
  });

  // handle 404 response
  app.use(function(req, res, next){
    res.render('404.jade', {title: "404 - Page Not Found", showFullNav: false, status: 404, url: req.url });
  });
};

function bootControllers(app) {
  // Bootstrap controllers
  var controllersPath = __dirname + '/app/controllers';
  var controllerFiles = fs.readdirSync(controllersPath);

  controllerFiles.forEach(function requireController(file) {
    require(controllersPath + '/' + file)(app);
  });
}