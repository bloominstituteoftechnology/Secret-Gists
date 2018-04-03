/* eslint-disable */
require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const Octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

/**
 * wrapper to send unhandled async/await errors to error handling middleware
 */
function wrapAsync(fn) {
  return (req, res, next) => {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next);
  };
}

let username = '';
const github = new Octokit({ debug: true });
const server = express();
server.use(bodyParser.json());
// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
const key =
process.env.SECRET_KEY
? nacl.util.decodeBase64(process.env.SECRET_KEY)
: nacl.randomBytes(32);

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
});

server.get('/gists', wrapAsync(async (req, res) => {
  const { data } = await github.gists.getForUser({ username });
  res.status(200).json({ data });
}));

server.get('/key', (req, res) => {
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { data } = await github.gists.get({ id });
  const filename = Object.keys(data.files)[0];
  const blob = data.files[filename].content;
  
  const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
  const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length));
  const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
  res.send(nacl.util.encodeUTF8(plaintext));
}));

server.post('/create', wrapAsync(async (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const files = {};
  files[req.body.name] = { content: req.body.content };
  const { data } = await github.gists.create({ files, description: 'test', public: false });
  
  res.status(200).json({ data });
}));

server.post('/createsecret', wrapAsync(async (req, res) => {
  const files = {};
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(req.body.content), nonce, key);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  files[req.body.name] = { content: blob };
  const { data } = await github.gists.create({ files, description: 'test-secret', public: false });
  
  res.status(200).json({ data });
}));

/* OPTIONAL - if you want to extend functionality */
server.post('/login', wrapAsync(async (req, res) => {
  // This will replace hardcoded username from above
  const { user, oauthToken } = req.body;
  if (!user || !oauthToken) throw new Error('invalid name or token');

  github.authenticate({
    type: 'oauth',
    token: oauthToken
  });

  try {
    const { data } = await github.users.get();
    username = data.login;
    res.json({ success: true });
  } catch(error) {
    res.json({ success: false });
  }
}));

/*
Still want to write code? Some possibilities:
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/

/**
 * error handling middleware
 */
server.use((error, req, res, next) => {
  console.log(error);
  res.json({ error: error.stack });
  next();
});

server.listen(3000, () => console.log('Server running on port 3000'));
