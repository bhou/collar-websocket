const jwt = require('jsonwebtoken');
const url = require('url');
const WebSocket = require('ws');
const Namespace = require('./Namespace');
const Socket = require('./Socket');


const WebSocketServer = WebSocket.Server;

class Server {
  constructor(server, options = {}) {
    let secretKey = options.secretKey || 'default-secret-key-bh';
    let option = Object.assign({
      server: server,
      perMessageDeflate: false,
      autoAcceptConnections: false,
      maxPayload: 10000000, // 10M
      verifyClient: (info, cb) => {
        cb(true);
        /*let token = info.req.headers.token;

        if (!token) {
          cb(false, 401, 'Unauthorized');
        } else {
          jwt.verify(token, secretKey, function (err, decoded) {
            if (err) {
              cb(false, 401, 'Unauthorized');
            } else {
              info.req.user = decoded;
              cb(true);
            }
          })
        }*/
      }
    }, options);

    this.wss = new WebSocketServer(option);

    this.nss = new Map();
    this.sockets = new Map();
    this.listeners = new Map();

    this.auth = (id, secret, done) => {
      done(null, {id});
    };
  
    this.wss.on('connection', (conn) => {
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
          let pathname = url.parse(conn.upgradeReq.url).pathname;
          let ns = this.of(pathname);
          ns.addSocket(so);
          
          this.handle('connect', so);
          so.emit('authorized');
        });
      });

      so.on('close', () => {
        let pathname = url.parse(conn.upgradeReq.url).pathname;
        let ns = this.of(pathname);
        ns.removeSocket(so);
      })
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
