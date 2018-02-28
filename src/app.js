const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'lightofdavinci';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();

require('dotenv').config();

server.use(bodyParser.json());
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
  github.users.getForUser({ username })
    .then((response) => { res.json(response.data); })
    .catch((err) => { res.json(err); });;
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({ username })
    .then((response) => { res.json(response.data); })
    .catch((err) => { res.json(err); });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  const secretKey = nacl.util.encodeBase64(key);
  res.json({ secretKey });
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;
  github.gists.get({ id }).then((response) => {
    const gist = response.data;
    const filename = Object.keys(gist.files)[0];
    const blob = gist.files[filename].content;
    const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
    const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length));
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
    res.send(nacl.util.encodeUTF8(plaintext));
  }).catch((err) => { res.json(err); });
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const { name, content, description } = req.body;
  github.gists.create({ public: false, description, files: { [name]: { content } } },
  () => res.json({ status: 'done' }));
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  const { name, content, description } = req.body;
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  github.gists.create({ public: false, description, files: { [name]: { content: blob } } })
    .then((response) => { res.json(response.data); })
    .catch((err) => { res.json(err); });
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above

  // const { oauth_token } = req.body;
  // github.authenticate({ type: 'oauth', token: oauth_token });
  // github.authorization.check({ oauth_token }).then((result) => { res.json({ success: true }) });
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
