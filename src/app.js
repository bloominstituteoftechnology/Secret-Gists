const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'dys2';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();

server.use(bodyParser.json());

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

const key = process.env.SECRET_KEY ?
  nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(nacl.secretbox.keyLength);
// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  const routes =
  `<html>
    <body>
      <h1>Available Routes</h1>
      <h2>GET /gist</h2><p>retrieves a list of all gists for the authed user</p>
      <h2>GET /key</h2><p>returns the secret key used for encryption</p>
      <h2>GET /secretgist/:id</h2><p>retrieves and decrypts the secret gist corresponding to the id</p>
      <h2>POST /create</h2><p>creates a private gist, must supply name and content</p>
      <h2>POST /createsecret</h2><p>create a private and encrypted gist, with name/content</p>
      <h2>POST /login</h2><p>login to github, replaces current username</p>
      </body>
    </html>`;
  res.send(routes);
});

server.get('/gists', async (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  try {
    const gists = await github.gists.getAll({});
    res.json(gists.data);
  } catch (error) {
    res.send(error);
  }
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.json(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', async (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  try {
    const { id } = req.params;
    const gist = await github.gists.get({ id });
    const file = Object.values(gist.data.files)[0];
    const nonce = nacl.util.decodeBase64(file.content.slice(0, 32));
    const decoded = nacl.util.decodeBase64(file.content.slice(32, file.content.length));
    const data = nacl.secretbox.open(decoded, nonce, key);
    file.content = nacl.util.encodeUTF8(data);
    res.json(file);
  } catch (err) {
    res.send(err);
  }
});

server.post('/create', async (req, res) => {
  // TODO Create a private gist with name and content given in post request
  try {
    const { name, content } = req.body;
    const gist = await github.gists.create({ files: { [name]: { content } }, public: false });
    res.json(gist);
  } catch (err) {
    res.send(err);
  }
});

server.post('/createsecret', async (req, res) => {
  try {
    const { name, content } = req.body;
    let nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    let encode = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
    nonce = nacl.util.encodeBase64(nonce);
    encode = nacl.util.encodeBase64(encode);
    encode = nonce + encode;
    const gist = await github.gists.create({ files: { [name]: { content: encode } }, public: false });
    res.json(gist.data);
  } catch (err) {
    res.send(err);
  }
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
  // const { username, oauth_token } = req.body;
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
