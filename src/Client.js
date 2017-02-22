const WebSocketClient = require('websocket').client;
const Socket = require('./Socket');

class Client {
  constructor(url, clientId, clientSecret, retryTimeout, maxRetry) {
    if (typeof url === 'string') {
      this.url = url;
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.retryTimeout = retryTimeout || 5000;
      this.maxRetry = maxRetry || Infinity;
    } else if (typeof url === 'object') {
      let opt = url;
      this.url = opt.url;
      this.clientId = opt.clientId;
      this.clientSecret = opt.clientSecret;
      this.retryTimeout = opt.retryTimeout || 5000;
      this.maxRetry = opt.maxRetry || Infinity;
    }
    this.clientInfo = null;
    this.retry = 0;
    this.enableRetry = true;

    this.client = new WebSocketClient();
    this.listeners = new Map();
    this.socket = null;

    this.authCb = null; // callback when auth is done
    this.unauthCb = null; // callback when auth failed
    this.retryCb = null;  // callback when retry connection

    this.connected = false;
  }

  connect() {
    this.client.on('connectFailed', (errorDescription) => {
      this.connected = false;

      if (!this.enableRetry || this.retry >= this.maxRetry) {
        return;
      }

      if (this.retryCb) this.retryCb();
      setTimeout(() => {
        this.retry++;
        this.doConnect();
      }, this.retryTimeout);
    });

    this.client.on('connect', (conn) => {
      this.connected = true;

      if (!this.socket) {
        this.socket = new Socket(this.clientId, conn);
      } else {
        this.socket.reset(this.clientId, conn);
      }

      this.socket.on('authorized', (data) => {
        this.retry = 0;
        if (this.authCb) this.authCb(this.socket);
        this.clientInfo = data;
      });

      this.socket.on('unauthorized', () => {
        this.connected = false;
        if (this.unauthCb) this.unauthCb();
      });

      this.socket.on('close', (reasonCode, description) => {
        this.connected = false;
        if (!this.enableRetry || this.retry >= this.maxRetry) {
          return;
        }

        if (this.retryCb) this.retryCb();
        setTimeout(() => {
          this.retry++;
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
    this.connected = false;
    this.client.connect(this.url);
  }

  on(msg, listener) {
    if (msg === 'authorized') this.authCb = listener;
    if (msg === 'unauthorized') this.unauthCb = listener;
    if (msg === 'retry') this.retryCb = listener;
  }

  emit(msg, data) {
    if (this.connected) this.socket.emit(msg, data);
    else console.warn('Can\'t send message, socket disconnected.', msg, data);
  }

  toggleRetry(retry) {
    this.enableRetry = retry;
  }
}

module.exports = Client;
