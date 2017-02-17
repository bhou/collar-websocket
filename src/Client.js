const WebSocketClient = require('websocket').client;
const Socket = require('./Socket');

class Client {
  constructor(url, clientId, clientSecret, retryTimeout) {
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
    this.retryTimeout = retryTimeout || 5000;


    this.client = new WebSocketClient();
    this.listeners = new Map();
    this.socket = null;

    this.auth = null; // callback when auth is done
    this.unauth = null; // callback when auth failed
    this.retry = null;  // callback when retry connection

    this.connected = false;
  }

  connect() {
    this.connected = false;

    this.client.on('connect', (conn) => {
      this.socket = new Socket(this.clientId, conn);

      this.socket.on('authorized', () => {
        this.connected = true;
        if (this.auth) this.auth(this.socket);
      });

      this.socket.on('unauthorized', () => {
        this.connected = false;
        if (this.unauth) this.unauth();
      });

      this.socket.on('close', (reasonCode, description) => {
        setTimeout(() => {
          if (this.retry) this.retry();
          this.doConnect();
        }, this.retryTimeout);
      });

      this.emit('authentication', {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      });
    });

    this.doConnect();
  }

  doConnect() {
    if (this.connected) {
      return;
    }
    this.client.connect(this.url);
  }

  on(msg, listener) {
    if (msg === 'authorized') this.auth = listener;
    if (msg === 'unauthorized') this.unauth = listener;
    if (msg === 'retry') this.retry = listener;
  }

  emit(msg, data) {
    this.socket.emit(msg, data);
  }
}

module.exports = Client;
