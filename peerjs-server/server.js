
const express = require('express');
const { ExpressPeerServer } = require('peer');

const app = express();
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`PeerJS server running on port ${port}`);
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});

app.use('/', peerServer);
