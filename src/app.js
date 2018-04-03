require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
const views = require('express-react-views');
nacl.util = require('tweetnacl-util');

const username = 'dreamingrainbow';  // TODO: your GitHub username here
const github = octokit({ debug: true });
const server = express();

server.set('views', path.join(__dirname, '/views'));
server.set('view engine', 'jsx');
server.engine('jsx', views.createEngine({ beautify: true }));
server.use('/', express.static(path.join(__dirname, 'views', 'public')));


const body = './index.jsx';
// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
const key = process.env.SECRET_KEY ? nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);


server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.render('index.jsx');
});


server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  const handle = username;
  github
  .users
  .getForUser({ username: handle })
  .then((response) => {
    res.send(response.data);
  });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;
  github
    .gists
    .get({ id })
    .then((response) => {
      const gist = response.data;
      const filename = Object.keys(gist.files)[0];
      const blob = gist.files[filename].content;
      const nonce = nacl.util.decodeBase64(blob.slice(0,32));
      const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length));
      const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
      res.send(nacl.util.encodeUTF8(plaintext));
    })
    .catch((err) => {
      res.status(500).statusMessage(err);
    });
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { name: { content } };
  github.gists.create({ files, public: false })
  .then((response) => {
    res.json(response.data);
  })
  .catch((err) => {
    res.json(err);
  });
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { name, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  const files = { name: { content: blob } };
  github.gists.create({files, public: false})
  .then((response) => {
    res.json(response.data);
  })
  .catch((err) => {
    res.json(err);
  });
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
  // const { username, oauth_token } = req.body;
  res.json({ success: false });
});

/*
Still want to write code? Some possibilities:
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/

server.listen(3000);
