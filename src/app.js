require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'VinnieScalco';  // TODO: your GitHub username here
const github = new octokit({ debug: true });
const server = express();

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
  github.users.getForUser({
    username
  }).then(response => {
    res.json(response.data);
    console.log("client id", response.data.id);
    client_id = response.data.id;
    // console.log(response.data);
  });
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({
    username
  }).then(response => {
    res.json(response.data);
  });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.json(boxKey.toString());
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  github.gists.create({
    key: "key",
    public: true,
    description: "My first gist",
    files: {
      "file1.txt": {
        content: "Aren't gists great!"
      }
    }
  },
    () => res.json({
      status: "done"
    })
  );
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  let pair = nacl.sign.keyPair();
  myPublicKey = pair.publicKey;
  let newNonce = () => nacl.randomBytes(24);
  let newBoxKey = () => nacl.randomBytes(32);
  nonce = newNonce();
  boxKey = newBoxKey();
  console.log("nonce", nonce, boxKey);
  let message = nacl.util.decodeUTF8('encrypt the stupid thing!');
  let encMessage = nacl.secretbox(message, nonce, boxKey);
  github.gists.create({
    public: false,
    description: "THE secret gist",
    files: {
      'file6.txt': {
        content: nacl.util.encodeBase64(encMessage)
      }
    }
  },
    () => res.json({
      content: nacl.util.encodeBase64(encMessage),
      status: 'done'
    })
  )
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
