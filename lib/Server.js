'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebSocket = require('websocket');
var Namespace = require('./Namespace');
var Socket = require('./Socket');

var WebSocketServer = WebSocket.server;

var Server = function () {
  function Server(server) {
    var _this = this;

    _classCallCheck(this, Server);

    this.wss = new WebSocketServer({
      httpServer: server,
      autoAcceptConnections: false
    });

    this.nss = new Map();
    this.sockets = new Map();
    this.listeners = new Map();

    this.auth = function (id, secret, done) {
      done(null, { id: id });
    };

    this.wss.on('request', function (req) {
      var conn = req.accept(null, req.origin);
      var so = new Socket(null, conn);

      // wait for authentication
      so.on('authentication', function (data) {
        // verify the auth here
        var clientId = data.clientId;
        var clientSecret = data.clientSecret;
        if (!_this.auth) {
          so.emit('unauthorized');
          return so.close(401, 'Unauthorized');
        }
        _this.auth(clientId, clientSecret, function (err, clientInfo) {
          if (err) {
            so.emit('unauthorized');
            return so.close(401, 'Unauthorized');
          }

          so.setClientId(clientInfo.id);
          so.setClientInfo(clientInfo);
          var pathname = req.resourceURL.pathname;
          var ns = _this.of(pathname);
          ns.addSocket(so);

          _this.handle('connect', so);
          so.emit('authorized');
        });
      });
    });
  }

  _createClass(Server, [{
    key: 'on',
    value: function on(msg, listener) {
      if (!this.listeners.has(msg)) {
        this.listeners.set(msg, []);
      }
      this.listeners.get(msg).push(listener);
    }
  }, {
    key: 'handle',
    value: function handle(msg) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var ls = this.listeners.get(msg);
      if (!ls) return;
      ls.forEach(function (l) {
        l(data);
      });
    }
  }, {
    key: 'onAuth',
    value: function onAuth(auth) {
      this.auth = auth;
    }
  }, {
    key: 'of',
    value: function of(name) {
      if (!this.nss.has(name)) {
        this.nss.set(name, new Namespace(name));
      }
      return this.nss.get(name);
    }
  }]);

  return Server;
}();

module.exports = Server;