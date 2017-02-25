const Socket = require('./Socket');

class Namespace {
  constructor(path) {
    this.path = path;
    this.sockets = new Map();
  }

  addSocket(so) {
    so.ns = this.path;
    this.sockets.set(so.clientId, so);
  }

  removeSocket(so) {
    let clientId = so.clientId;
    if (this.sockets.has(clientId)) {
      this.sockets.delete(clientId);
    }
  }

  emit(msg, data) {
    for (let so of this.sockets.values()) {
      so.emit(msg, data);
    } 
  }

  getSocket(id) {
    return this.sockets.get(id);
  }
}

module.exports = Namespace;
