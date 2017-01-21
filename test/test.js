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
      so.close();
      server.close();
      test.done();
    });
    client.on('unauthorized', (so) => {
      server.close();
      test.done();
    });
    client.connect();
  }
}
