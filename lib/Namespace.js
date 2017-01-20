'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Socket = require('./Socket');

var Namespace = function () {
  function Namespace(path) {
    _classCallCheck(this, Namespace);

    this.path = path;
    this.sockets = new Map();
  }

  _createClass(Namespace, [{
    key: 'addSocket',
    value: function addSocket(so) {
      so.ns = this.path;
      this.sockets.set(so.clientId, so);
    }
  }, {
    key: 'emit',
    value: function emit(msg, data) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.sockets.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var so = _step.value;

          so.emit(msg, data);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'getSocket',
    value: function getSocket(id) {
      return this.sockets.get(id);
    }
  }]);

  return Namespace;
}();

module.exports = Namespace;