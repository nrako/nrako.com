
/**
 * oh
 * Module dependencies.
 */
require('console-trace');
console.traceAlways = true;

var express = require('express'),
    config = require('config'),
    mvc = require('./mvc'),
    io = require('./io');

// TODO use https://github.com/LearnBoost/up
var server = module.exports = express.createServer();

var app = express.createServer();

var redirect = express.createServer();

// redirect all subdomain www and others
redirect.all('*', function(req, res){
  res.redirect('http://' + config.hostname + (config.port == 80 ? '' :':' + config.port) + req.url);
});

server.use(express.vhost(config.hostname, app));
server.use(express.vhost('*.' + config.hostname, redirect));

// boot MVC application make use of middlewares and boot controllers
mvc.boot(app);

// run socket.io
io.run(server, mvc.sessionStore);

var port = process.argv[2] || config.port;

port = isNaN(port) ? config.port : port;

console.dir(process.env);

server.listen(port);
console.log("Express server listening on port %d in %s mode for host %s", server.address().port, server.settings.env, config.hostname);
