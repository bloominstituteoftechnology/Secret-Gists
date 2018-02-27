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
  github.gists
    .getForUser({
      username,
    })
    .then(response => {
      res.json(response.data);
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
  github.gists.create(
    {
      key: 'key',
      public: true,
      description: 'My first gist',
      files: { 'files.txt': { content: "Aren't gists great!" } },
    },
    () => res.json({ status: 'done' })
  );
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
  try {
    // console.log(`req.body.access_token: ${req.body.access_token} keys: ${Object.keys(res.body)})}`);
    const { access_token } = req.body;
    github.authenticate({
      type: 'oauth',
      token: access_token,
    });
    github.authorization
      .check({
        access_token,
      })
      .then(result => {
        res.json({
          success: result,
        });
      });
  } catch (error) {
    res.json({
      catchError: true,
      error,
    });
  }
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
