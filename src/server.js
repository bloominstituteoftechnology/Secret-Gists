const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const randomstring = require("randomstring");
const tou8 = require('buffer-to-uint8array');
const textEncoding = require('text-encoding');
const cors = require('cors');

const username = 'WooPanda';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

const corsOptions = {
  'origin': 'http://localhost:3001',
  'credentials': true
};
server.use(cors(corsOptions));

server.use(bodyParser.json());
// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
const key = process.env.SECRET_KEY ? nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  const document = {
    '/gists': 'returns all gitsts',
    '/key': 'Returns the secret key used for encryption of secret gists',
    '/secretgist/:id': 'Retrieve and decrypt the secret gist corresponding to the given ID',
    '/create': 'Create a private gist with name and content given in post request',
    '/createsecret': 'Create a private and encrypted gist with given name/content',
    '/login': 'log in to GitHub, return success/failure response',

  };
  res.json(document);
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user

  const date = new Date((new Date() - 3.154e+10));
  github.gists.getAll({ since: date })
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.json(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;
  github.gists.get({ id })
    .then((result) => {
      const gist = result.data;
      const filename = Object.keys(gist.files)[0];
      const encryptedStr = gist.files[filename].content;

      const nonce = nacl.util.decodeBase64(encryptedStr.slice(0, 32));
      const ciphertext = nacl.util.decodeBase64(encryptedStr.slice(32, encryptedStr.length));
      const plaintext = nacl.secretbox.open(ciphertext, nonce, key);

      res.json(nacl.util.encodeUTF8(plaintext));
    })
    .catch((err) => {
      res.json(err);
    });

});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const description = req.body.description;
  const boolean = req.body.public === 'true';
  const files = req.body.files;

  github.gists.create({ files, public: boolean, description })
    .then((result) => {
      res.json(result.data);
    })
    .catch((error) => {
      res.json(error);
    });
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  
  const description = req.body.description;
  const boolean = false;
  const files = req.body.files;
  const filename = req.body.filename;
  const content = files[filename].content;

  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);

  const encryptedStr = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);

  files[filename].content = encryptedStr;

  github.gists.create({ files, public: boolean, description })
  .then((result) => {
    res.json(result.data);
  })
  .catch((error) => {
    res.json(error);
  });

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



// "start": "eslint src/*.js && nodemon src/app.js",