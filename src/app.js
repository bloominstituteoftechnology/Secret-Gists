require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');

nacl.util = require('tweetnacl-util');

// const username = 'jproland';
const github = new GitHubApi({ debug: true });
const server = express();

server.use(bodyParser.json());

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
// github.authenticate({
//   type: 'oauth',
//   token: process.env.GITHUB_TOKEN
// });

// Set up the encryption - use process.env.SECRET_KEY if it exists
const key = process.env.KEY
  ? nacl.util.decodeBase64(process.env.KEY)
  : nacl.randomBytes(32);

server.get('/', (req, res) => {
  res.send(
    'Usage:<br /> GET /gists retrieve a list of all gists for current user<br />' +
      'GET /key return secret key for encryption of gists<br />' +
      'GET /secretgist/:id Retrieve and decrypt the gist with the given id <br />' +
      'POST /create create a private gist witha name and content in post request <br />' +
      'POST /createsecret create an encrypted gist with name and content' +
      'POST /login authenticate with github using Oauth token passed in from the request body'
  );
});

server.get('/gists', async (req, res) => {
  try {
    const result = await github.gists.getAll({});
    res.json(result.data);
  } catch (error) {
    res.json(error);
  }
});

server.get('/key', (req, res) => {
  res.json({ key: nacl.util.encodeBase64(key) });
});

server.get('/secretgist/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await github.gists.get({ id });
    const fName = Object.keys(result.data.files)[0];
    const blob = result.data.files[fName].content;
    const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
    const cipherText = nacl.util.decodeBase64(blob.slice(32, blob.length));
    const plaintext = nacl.secretbox.open(cipherText, nonce, key);
    res.json({ text: nacl.util.encodeUTF8(plaintext) });
  } catch (error) {
    return res.json(error);
  }
});

server.post('/create', async (req, res) => {
  const { name, content } = req.body;

  try {
    const result = await github.gists.create({
      files: { [name]: { content } },
      public: false
    });
    res.json(result.data);
  } catch (error) {
    return res.json(error);
  }
});

server.post('/createsecret', async (req, res) => {
  const { name, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const cipherText = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const blob =
    nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(cipherText);

  try {
    const result = await github.gists.create({
      files: { [name]: { content: blob } },
      public: false
    });
    res.json(result.data);
  } catch (error) {
    return res.json(error);
  }
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', async (req, res) => {
  const { oauth_token } = req.body;
  github.authenticate({
    type: 'oauth',
    token: oauth_token
  });
  res.json({ success: true });
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
