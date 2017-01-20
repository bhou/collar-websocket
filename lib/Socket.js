'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Constants = require('./Constants');

var Socket = function () {
  function Socket(clientId, conn, ns) {
    var _this = this;

    _classCallCheck(this, Socket);

    this.clientId = clientId;
    this.clientInfo = null;
    this.conn = conn;
    this.ns = ns;

    this.listeners = new Map();

    this.conn.on('message', function (message) {
      if (message.type === 'utf8') {
        _this.handle(message.utf8Data);
      } else if (message.type === 'binary') {
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });
  }

  _createClass(Socket, [{
    key: 'setClientId',
    value: function setClientId(id) {
      this.clientId = id;
    }
  }, {
    key: 'setClientInfo',
    value: function setClientInfo(info) {
      this.clientInfo = info;
    }
  }, {
    key: 'on',
    value: function on(msg, listener) {
      if (!this.listeners.has(msg)) {
        this.listeners.set(msg, []);
      }
      this.listeners.get(msg).push(listener);
    }
  }, {
    key: 'handle',
    value: function handle(message) {
      var _this2 = this;

      try {
        var _ret = function () {
          var data = JSON.parse(message);
          var type = data[Constants.MSG_TYPE];
          delete data[Constants.MSG_TYPE];
          delete data[Constants.CLIENT_ID];
          var ls = _this2.listeners.get(type);
          if (!ls) return {
              v: void 0
            };
          ls.forEach(function (l) {
            l(data);
          });
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } catch (err) {
        console.error(err);
        return;
      }
    }
  }, {
    key: 'emit',
    value: function emit(msg) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      data[Constants.MSG_TYPE] = msg;
      data[Constants.CLIENT_ID] = this.clientId;
      this.conn.sendUTF(JSON.stringify(data));
    }
  }, {
    key: 'close',
    value: function close() {
      this.conn.close();
    }
  }]);

  return Socket;
}();

module.exports = Socket;