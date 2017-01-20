const Constants = require('./Constants');

class Socket {
  constructor(clientId, conn, ns) {
    this.clientId = clientId;
    this.clientInfo = null;
    this.conn = conn;
    this.ns = ns;

    this.listeners = new Map();

    this.conn.on('message', (message) => {
      if (message.type === 'utf8') {
        this.handle(message.utf8Data);
      } else if (message.type === 'binary') {
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });
  }

  setClientId(id) {
    this.clientId = id;
  }

  setClientInfo(info) {
    this.clientInfo = info;
  }

  on(msg, listener) {
    if (!this.listeners.has(msg)) {
      this.listeners.set(msg, []);
    }
    this.listeners.get(msg).push(listener);
  }

  handle(message) {
    try {
      let data = JSON.parse(message);
      let type = data[Constants.MSG_TYPE];
      delete data[Constants.MSG_TYPE];
      delete data[Constants.CLIENT_ID];
      let ls = this.listeners.get(type);
      if (!ls) return;
      ls.forEach(l => {
        l(data);
      });
    } catch (err) {
      console.error(err);
      return;
    }
  }

  emit(msg, data = {}) {
    data[Constants.MSG_TYPE] = msg;
    data[Constants.CLIENT_ID] = this.clientId;
    this.conn.sendUTF(JSON.stringify(data));
  }

  close() {
    this.conn.close();
  }
}

module.exports = Socket;
