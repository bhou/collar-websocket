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
    if (msg === 'close') {
      this.conn.on('close', listener);
      return;
    }

    if (!this.listeners.has(msg)) {
      this.listeners.set(msg, []);
    }
    this.listeners.get(msg).push(listener);
  }

  handle(message) {
    try {
      let payload = JSON.parse(message);
      let type = payload[Constants.MSG_TYPE];
      let data = payload[Constants.DATA];
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

  emit(msg, data) {
    let payload = {};
    payload[Constants.MSG_TYPE] = msg;
    payload[Constants.CLIENT_ID] = this.clientId;
    payload[Constants.DATA] = data;
    this.conn.sendUTF(JSON.stringify(payload));
  }

  close() {
    this.conn.close();
  }
}

module.exports = Socket;
