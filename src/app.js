require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const Octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = process.env.GITHUB_USERNAME;
const github = new Octokit({ debug: true });

const server = express();
server.use(bodyParser.json());

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
const key = process.env.SECRET_KEY
  ? nacl.util.decodeBase64(process.env.SECRET_KEY)
  : nacl.randomBytes(32);

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  const apiDesc = {
    '/gists': '[GET] retrieve a collection of gists',
    '/key': '[GET] return the secret key for encryption of secret gists',
    '/secretgist/:id':
      '[GET] retrieve and decrypt the secret gist corresponding to the given ID',
    '/create':
      '[POST] create a private gist with name and content given in post request',
    '/createsecret':
      '[POST] create a private and encrypted gist with given name/content',
    '/login': '[POST] login to github'
  };
  res.send(apiDesc);
});

server.get('/gists', async (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  try {
    const result = await github.gists.getForUser({ username });
    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error });
  }
});

server.get('/key', (req, res) => {
  // Return the secret key used for encryption of secret gists
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', async (req, res) => {
  // Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;
  const result = await github.gists.get({ id });
  const gist = result.data;

  const filename = Object.keys(gist.files)[0];
  const blob = gist.files[filename].content;

  // 24 byte nonce === 32 characters encoded in Base64
  const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
  const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length));
  const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
  res.send(nacl.util.encodeUTF8(plaintext));
});

server.post('/create', async (req, res) => {
  // Create a private gist with name and content given in post request
  try {
    const { name, content } = req.body;
    const files = { [name]: { content } };
    const result = await github.gists.create({ files, public: false });
    res.status(201).json(result.data);
  } catch (error) {
    res.status(500).json({ error });
  }
});

server.post('/createsecret', async (req, res) => {
  // Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  try {
    const { name, content } = req.body;
    const nonce = nacl.randomBytes(24);
    const ciphertext = nacl.secretbox(
      nacl.util.decodeUTF8(content),
      nonce,
      key
    );
    // To save, we need to keep both encrypted content and nonce
    const blob =
      nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
    const files = { [name]: { content: blob } };
    const result = await github.gists.create({ files, public: false });
    res.status(201).json(result.data);
  } catch (error) {
    res.status(500).json({ error });
  }
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
