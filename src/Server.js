const WebSocket = require('websocket');
const Namespace = require('./Namespace');
const Socket = require('./Socket');

const WebSocketServer = WebSocket.server;

class Server {
  constructor(server) {
    this.wss = new WebSocketServer({
      httpServer: server,
      autoAcceptConnections: false,
    });

    this.nss = new Map();
    this.sockets = new Map();
    this.listeners = new Map();

    this.auth = (id, secret, done) => {
      done(null, {id});
    };
  
    this.wss.on('request', (req) => {
      let conn = req.accept(null, req.origin);
      let so = new Socket(null, conn);

      // wait for authentication
      so.on('authentication', (data) => {
        // verify the auth here
        const clientId = data.clientId;
        const clientSecret = data.clientSecret;
        if (!this.auth) {
          so.emit('unauthorized');
          return so.close(401, 'Unauthorized');
        }
        this.auth(clientId, clientSecret, (err, clientInfo) => {
          if (err) {
            so.emit('unauthorized');
            return so.close(401, 'Unauthorized');
          }

          so.setClientId(clientInfo.id);
          so.setClientInfo(clientInfo);
          let pathname = req.resourceURL.pathname;
          let ns = this.of(pathname);
          ns.addSocket(so);
          
          this.handle('connect', so);
          so.emit('authorized');
        });
      });
    });
  }

  on(msg, listener) {
    if (!this.listeners.has(msg)) {
      this.listeners.set(msg, []);
    }
    this.listeners.get(msg).push(listener);
  }

  handle(msg, data = {}) {
    let ls = this.listeners.get(msg);
    if (!ls) return;
    ls.forEach(l => {
      l(data);
    });
  }

  onAuth(auth) {
    this.auth = auth;
  }

  of(name) {
    if (!this.nss.has(name)) {
      this.nss.set(name, new Namespace(name));
    }
    return this.nss.get(name);
  }
}

module.exports = Server;
