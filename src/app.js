const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

DotEnv = require('dotenv-node');
new DotEnv();

const username = 'frogr';
const github = new GitHubApi({ debug: true });
const server = express();
server.use(bodyParser.json());
const PORT = 8950;

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key

server.get('/', (req, res) => {
  res.send(`
  <html>
  <body>
  <h2>GET:</h2>
  <h3>/gists</h3>
  <p>Retrieve a list of all gists for the currently authed user</p>
  <h3>/key</h3>
  <p>Return the secret key used for encryption of secret gists</p>
  <h3>/secretgist/:id</h3>
  <p>Create a private gist with name and content given in post request</p>

  <h2>POST:</h2>
  <h3>/create</h3>
  <p>Create a private gist with name and content given in post request</p>
  <h3>/createsecret</h3>
  <p>Create a private and encrypted gist with given name/content</p>
  <h3>/login</h3>
  <p>log in to GitHub, return success/failure response</p>
  </body>
  </html>
  `);
});

server.get('/gists', (req, res) => {
  github.gists.getForUser({ username }).then(gists => {
    res.json(gists.data);
  });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
});

server.post('/create', (req, res) => {
  console.log(req.body);
  const { name, content } = req.body;
  github.gists
    .create({ files: { [name]: { content } }, public: false })
    .then(gists => {
      res.json(gists.data);
    })
    .catch(e => {
      res.json(e);
    });
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
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

server.listen(PORT, () => {
  console.log(`server up and running on port ${PORT}`);
});
