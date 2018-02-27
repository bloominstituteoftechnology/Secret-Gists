const nacl = require('tweetnacl');
const express = require('express');
const GitHubApi = require('github');
const bodyParser = require('body-parser');

nacl.util = require('tweetnacl-util');

const username = 'davdaarn'; // TODO: your GitHub username here
const token = require('../token');
const github = new GitHubApi({ debug: true });
const server = express();

server.use(bodyParser.json());

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: token.GITHUB_TOKEN,
  // token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key

server.get('/test', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  console.log(token.GITHUB_TOKEN);
  github.users.getForUser({ username }).then(response => {
    // console.log(response.data);
    res.json(response.data);
  });
});

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.json({
    '/gists': '',
    '/key': '',
    '/secretgist/:id': '',
    '/create': '',
    '/createsecret': '',
    '/login': '',
  });
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  github.users.getForUser({ username }).then(response => {
    console.log(response.data);
  });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  github.authorization
    .check({ access_token: token, client_id: client_id })
    .then(result => {
      res.json(response.data);
    });
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const test = { key, content: 'test', name: 'test name' };
  github.gists.create(test, true, 'Test Gist');
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

server.listen(3000);
