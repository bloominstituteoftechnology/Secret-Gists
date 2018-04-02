require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const Octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'jessehood';  // TODO: your GitHub username here
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
// TODO either use or generate a new 32 byte key
const key = process.env.SECRET_KEY;
server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
});

server.get('/gists', async (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  try {
    const { data } = await github.gists.getForUser({ username });
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error });
  }
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists

});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
});

server.post('/create', async (req, res) => {
  // TODO Create a private gist with name and content given in post request
  try {
    const files = {};
    files[req.body.name] = { content: req.body.content };
    const { data } = await github.gists.create({ files, description: 'test', public: false });

    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
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

server.listen(3000, () => console.log('Server running on port 3000'));
