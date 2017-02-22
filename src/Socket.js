const Constants = require('./Constants');

class Socket {
  constructor(clientId, conn, ns) {
    this.reset(clientId, conn, ns);
  }

  setClientId(id) {
    this.clientId = id;
  }

  reset(clientId, conn, ns) {
    this.clientId = clientId;
    this.clientInfo = null;
    this.conn = conn;
    this.ns = ns;

    this.closeHandler = null; // on close handler

    this.connected = true;

    this.listeners = new Map();

    this.conn.on('message', (message) => {
      if (message.type === 'utf8') {
        this.handle(message.utf8Data);
      } else if (message.type === 'binary') {
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      }
    });

    this.conn.on('close', (reasonCode, description) => {
      this.conncted = false;
      if (this.closeHandler) this.closeHandler();
    });
  }

  setClientInfo(info) {
    this.clientInfo = info;
  }

  on(msg, listener) {
    if (msg === 'close') {
      this.closeHandler = listener;
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
    if (!this.connected) {
      return;
    }

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
