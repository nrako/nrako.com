var io = require('socket.io');

var Session = require('connect').middleware.session.Session;

exports.flashMsg = function () {};

exports.run = function run(server, sessionStore) {
  var sio = io.listen(server);
  exports.sio = sio;

  var parseCookie = require('connect').utils.parseCookie;

  // handshake function thx to http://www.danielbaulig.de/socket-ioexpress/
  sio.set('authorization', function ioHandShake(data, accept) {
    if (!data.headers.cookie) {
      // refuse authorization if no cookie is found
      return accept('No cookie transmitted.', false);
    }

    data.cookie = parseCookie(data.headers.cookie);
    data.sessionID = data.cookie['express.sid'];

    // save the session store to the data object 
    // (as required by the Session constructor)
    data.sessionStore = sessionStore;

    sessionStore.get(data.sessionID, function (err, session) {
      if (err || !session) {
        // if we cannot grab a session, turn down the connection
        return accept('Not able to find a valid session', false);
      }
      
      data.session = new Session(data, session);

      return accept(null, true);
    });

    exports.flashMsg = function (type, msg) {
      sio.sockets.in(data.sessionID)
        .emit('flashmsg', {guid: (+new Date()), type: type, msg: msg});
    }
  });

  sio.configure(function ioConfigure() {
    sio.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
  });

  sio.configure('development', function ioDevConfigure() {
    sio.set('transports', ['websocket', 'xhr-polling']);
    sio.enable('log');
  });

  sio.sockets.on('connection', function ioOnConnection (socket) {
    var hs = socket.handshake;
    //console.log('A socket with sessionID ' + hs.sessionID + ' connected!');

    socket.join(hs.sessionID);

    // setup an inteval that will keep our session from timing out 
    // as long as the websocket connection is open
    var intervalID = setInterval(function () {
      // reload the session (just in case something changed,
      // we don't want to override anything, but the age)
      // reloading will also ensure we keep an up2date copy
      // of the session with our connection.
      hs.session.reload( function () { 
        // "touch" it (resetting maxAge and lastAccess)
        // and save it back again.
        hs.session.touch().save();
      });
    }, 60 * 1000);

    socket.on('disconnect', function () {
      //console.log('A socket with sessionID ' + hs.sessionID + ' disconnected!');
      // clear the socket interval to stop refreshing the session
      clearInterval(intervalID);
    });

    socket.on('closeflashmsg', function (flashMsgKey) {
      console.log('closeflashmsg', socket.handshake.sessionID, arguments);
      
      socket.volatile
        .broadcast.to(socket.handshake.sessionID)
        .emit('closeflashmsg', flashMsgKey);
    })

  });
}