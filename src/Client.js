const WebSocketClient = require('websocket').client;
const Socket = require('./Socket');

class Client {
  constructor(url, clientId, clientSecret) {
    if (typeof url === 'string') {
      this.url = url;
      this.clientId = clientId;
      this.clientSecret = clientSecret;
    } else if (typeof url === 'object') {
      let opt = url;
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

  connect() {
    this.client.connect(this.url);

    this.client.on('connect', (conn) => {
      this.socket = new Socket(this.clientId, conn);

      this.socket.on('authorized', () => {
        this.auth(this.socket);
      });

      this.socket.on('unauthorized', () => {
        this.unauth();
      });

      this.emit('authentication', {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      });
    });
  }

  on(msg, listener) {
    if (msg === 'authorized') this.auth = listener;
    if (msg === 'unauthorized') this.unauth = listener;
  }

  emit(msg, data = {}) {
    this.socket.emit(msg, data);
  }
}

module.exports = Client;
