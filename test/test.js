const Server = require('../src/Server');
const Client = require('../src/Client');

exports['test socket'] = {
  "echo test": (test) => {
    const express = require('express');
    const app = express();

    const server = app.listen(8080, function () {});

    const wss = new Server(server);

    wss.on('connect', (so) => {
      so.on('req', (data) => {
        so.emit('res', data); // echo
      })
    });

    const client = new Client('ws://localhost:8080');
    client.on('authorized', (so) => {
      so.on('res', (data) => {
        test.equal(data.greeting, 'Hello World!');
        client.toggleRetry(false);
        so.close();
        server.close();
        test.done();
      });

      so.emit('req', {greeting: 'Hello World!'});
    });

    client.connect();
  },

  "echo primitive data test": (test) => {
    const express = require('express');
    const app = express();

    const server = app.listen(8080, function () {});

    const wss = new Server(server);

    wss.on('connect', (so) => {
      so.on('req', (data) => {
        so.emit('res', data); // echo
      })
    });

    const client = new Client('ws://localhost:8080');
    client.on('authorized', (so) => {
      so.on('res', (data) => {
        test.equal(data, 'hello!');
        client.toggleRetry(false);
        so.close();
        server.close();
        test.done();
      });

      so.emit('req', 'hello!');
    });
    client.connect();
  },

  "auth test": (test) => {
    const express = require('express');
    const app = express();
    const server = app.listen(8080, function () {});
    const wss = new Server(server);
    wss.onAuth((id, secret, done) => {
      if (id === 'test' && secret === 'test') {
        return done(null, {id});
      }
      done(new Error('unauthorized'));
    });
    wss.on('connect', (so) => {
      test.equal(so.clientId, 'test');
    });


    const client = new Client('ws://localhost:8080', 'test', 'test');
    client.on('authorized', (so) => {
      client.toggleRetry(false);
      so.close();
      server.close();
      test.done();
    });
    client.connect();
  },

  "unauth test": (test) => {
    const express = require('express');
    const app = express();
    const server = app.listen(8080, function () {});
    const wss = new Server(server);
    wss.onAuth((id, secret, done) => {
      if (id === 'test' && secret === 'test') {
        return done(null, {id});
      }
      done(new Error('unauthorized'));
    });
    wss.on('connect', (so) => {
      test.equal(so.clientId, 'test');
    });

    const client = new Client('ws://localhost:8080', 'test1', 'test');
    client.on('authorized', (so) => {
      test.fail();
      client.toggleRetry(false);
      so.close();
      server.close();
      test.done();
    });
    client.on('unauthorized', (so) => {
      client.toggleRetry(false);
      server.close();
      test.done();
    });
    client.connect();
  },

  "test retry when unauth": (test) => {
    const express = require('express');
    const app = express();
    const port = 8080;
    const server = app.listen(port, function () {});
    const wss = new Server(server);
    wss.onAuth((id, secret, done) => {
      if (id === 'test' && secret === 'test') {
        return done(null, {id});
      }
      done(new Error('unauthorized'));
    });
    wss.on('connect', (so) => {
    });

    const client = new Client(`ws://localhost:${port}`, 'test1', 'test', 1000, 1);
    client.on('authorized', (so) => {
    });
    client.on('unauthorized', (so) => {
    });
    let retry = 0;
    client.on('retry', () => {
      retry++;
      console.log(`retry connection ${retry}`);
    });
    client.connect();

    setTimeout(() => {
      server.close(() => {
        test.ok(retry > 0);
        test.done();
      })
    }, 3000);
  },

  "test retry when close": (test) => {
    const express = require('express');
    const app = express();
    const port = 8081;
    const server = app.listen(port, function () {
    });
    const wss = new Server(server);
    wss.onAuth((id, secret, done) => {
      if (id === 'test' && secret === 'test') {
        return done(null, {id});
      }
      done(new Error('unauthorized'));
    });
    wss.on('connect', (so) => {
      setTimeout(() => {
        so.close(500, 'Internal Error');
      }, 1000);
    });

    const client = new Client(`ws://localhost:${port}`, 'test', 'test', 1000, 1);
    client.on('authorized', (so) => {
    });
    client.on('unauthorized', (so) => {
    });
    let retry = 0;
    client.on('retry', () => {
      retry++;
      console.log(`retry connection ${retry}`);
    });
    client.connect();

    setTimeout(() => {
      server.close(() => {
        test.ok(retry > 0);
        test.done();
      });
    }, 3000);
  }
};
