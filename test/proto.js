const Server = require('../src/Server');
const Client = require('../src/Client');

const express = require('express');
const app = express();

const server = app.listen(8080, function () {
  console.log('collar dev server listening on port', 8080);
});


// server
const wss = new Server(server);

wss.onAuth((clientId, clientSecret, done) => {
  if (clientId.indexOf('testClient') !== 0 || clientSecret !== 'testSecret') {
    console.log('server: unauthorized client:', clientId, clientSecret);
    return done(new Error('unauthorized'));
  }
  console.log('server: authorized client', clientId);
  done(null, {id: clientId});
});

wss.on('connect', (so) => {
  console.log('server: client connected', so.clientId);

  if (so.ns === '/collector') {
    // collector
    so.on('upstream', (data) => {
      wss.of('/representer').emit('upstream', data);
    });
  }
  
  if (so.ns === '/representer') {
    // representer
    so.on('downstream', (data) => {
      wss.of('/collector').emit('downstream', data);
    });
  }
});



// collector
const client1 = new Client('ws://localhost:8080/collector', 'testClient1', 'testSecret');

client1.on('authorized', (so) => {
  console.log('collector 1: authorized');

  so.on('downstream', (data) => {
    console.log('collector 1 received msg:', data);
  });

  so.emit('upstream', { greeting: 'Hello!' });
});

client1.on('unauthorized', (data) => {
  console.log('collector 1: unauthorized!');
});

client1.connect();

const client2 = new Client('ws://localhost:8080/collector', 'testClient2', 'testSecret');

client2.on('authorized', (so) => {
  console.log('collector 2: authorized');

  so.on('downstream', (data) => {
    console.log('collector 2 received msg:', data);
  });

  so.emit('upstream', { greeting: 'Hello!' });
});

client2.on('unauthorized', (data) => {
  console.log('collector 2: unauthorized!');
});

client2.connect();



// representer
const client3 = new Client('ws://localhost:8080/representer', 'testClient3', 'testSecret');

client3.on('authorized', (so) => {
  console.log('representer 1: authorized');

  so.on('upstream', (data) => {
    console.log('representer 1: repsonse', data);
    so.emit('downstream', { greeting: 'Hello! from representer 1' });
  });
});

client3.on('unauthorized', (data) => {
  console.log('representer 1: unauthorized!');
});

client3.connect();

const client4 = new Client('ws://localhost:8080/representer', 'testClient4', 'testSecret');

client4.on('authorized', (so) => {
  console.log('representer 2: authorized');

  so.on('upstream', (data) => {
    console.log('representer 2: repsonse', data);
    so.emit('downstream', { greeting: 'Hello! from representer 1' });
  });
});

client4.on('unauthorized', (data) => {
  console.log('representer 2: unauthorized!');
});

client4.connect();

