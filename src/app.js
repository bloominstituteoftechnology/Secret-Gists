require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = process.env.GITHUB_USERNAME;  // TODO: your GitHub username here
const github = new octokit({ debug: true });
const server = express();

server.use(bodyParser.json());

const SUCCESS = 200;
const ERROR = 422;

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

const key = nacl.util.decodeBase64(process.env.SECRET);

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({ username })
    .then((response) => {
      res.status(SUCCESS).json(response.data);
    })
    .catch((err) => {
      res.status(ERROR).json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  const secretKey = nacl.util.encodeBase64(key);
  res.status(SUCCESS).json({ key: secretKey });
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;
  github.gists.get({ id })
    .then(response => {
      const gist = response.data;
      const filename = Object.keys(gist.files)[0];
      const contentHash = gist.files[filename].content;

      const nonce = nacl.util.decodeBase64(contentHash.slice(0, 32));
      const contentPart = contentHash.slice(32, contentHash.length);
      const cipherText = nacl.util.decodeBase64(contentPart);
      const decrypted = nacl.secretbox.open(cipherText, nonce, key);
      
      res.status(SUCCESS).json({ content: nacl.util.encodeUTF8(decrypted) });
    })
    .catch(error => {
      console.log(error);
      res.status(ERROR).json({ error });
    });
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const { name, content, private } = req.body;
  const files = {
    [name]: { content },
  };
  const public = (private !== false);
  const options = { files, public };

  github.gists.create(options)
    .then(response => {
      res.status(SUCCESS).json(response);
    })
    .catch(error => {
      res.status(ERROR).json(error);
    });

});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { name, content } = req.body;

  const nonce = nacl.randomBytes(24);
  const cipherText = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const contentHash = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(cipherText);
  
  const files = {
    [name]: { content: contentHash },
  };
  const public = false;
  const options = { files, public };
  // console.log();
  github.gists.create(options)
    .then(response => {
      res.status(SUCCESS).json(response);
    })
    .catch(error => {
      res.status(ERROR).json(error);
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
