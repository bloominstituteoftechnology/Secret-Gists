const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
require('dotenv').config()

const username = 'vibe';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();
const key = process.env.SECRET_KEY ? nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);
console.log(key);
// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
});

server.get('/gists', async (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  try {
    const { data:gists } = await github.gists.getForUser({ username });
    res.json(gists);
  } catch (e) {
    res.status(422).json({ message: 'Failed to retrieve a list of user gists', error: e });
  }
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.json({ key: nacl.util.encodeBase64(key) });
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;
  const { data:gist } = github.gists.get({ id });
});

async function createGists(gists) {
  try {
    const { data:response } = await github.gists.create({ gists, public: false });
    return response;
  } catch (e) {
    return new Error({ message: 'Failed to create gists', error: e });
  }
}

server.post('/create', async (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const gists = { [name]: { content } };
  try {
    const response = await createGists(gists);
    res.json(response);
  } catch (e) {
    res.json(e);
  }

});

server.post('/createsecret', async (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { name, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const encryptedContent = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(encryptedContent);
  const gists = { [name]: { content: blob} };
  try {
    const response = await createGists(gists);
    res.json(response);
  } catch (e) {
    res.json(e);
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
