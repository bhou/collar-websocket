'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebSocketClient = require('websocket').client;
var Socket = require('./Socket');

var Client = function () {
  function Client(url, clientId, clientSecret) {
    _classCallCheck(this, Client);

    if (typeof url === 'string') {
      this.url = url;
      this.clientId = clientId;
      this.clientSecret = clientSecret;
    } else if ((typeof url === 'undefined' ? 'undefined' : _typeof(url)) === 'object') {
      var opt = url;
      this.url = opt.url;
      this.clientId = opt.clientId;
      this.clientSecret = opt.clientSecret;
    }

    this.client = new WebSocketClient();
    this.listeners = new Map();
    this.socket = null;
    this.auth = null;
    this.unauth = null;
  }

  _createClass(Client, [{
    key: 'connect',
    value: function connect() {
      var _this = this;

      this.client.connect(this.url);

      this.client.on('connect', function (conn) {
        _this.socket = new Socket(_this.clientId, conn);

        _this.socket.on('authorized', function () {
          _this.auth(_this.socket);
        });

        _this.socket.on('unauthorized', function () {
          _this.unauth();
        });

        _this.emit('authentication', {
          clientId: _this.clientId,
          clientSecret: _this.clientSecret
        });
      });
    }
  }, {
    key: 'on',
    value: function on(msg, listener) {
      if (msg === 'authorized') this.auth = listener;
      if (msg === 'unauthorized') this.unauth = listener;
    }
  }, {
    key: 'emit',
    value: function emit(msg) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      this.socket.emit(msg, data);
    }
  }]);

  return Client;
}();

module.exports = Client;