require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const Octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'atiffany';  // TODO: your GitHub username here
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
const key = process.env.SECRET_KEY ? nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.send('List of Options:\nSee Gists\nGet Key\nCreate New Gist\nCreate New Secret Gist\n');
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  // res.send('NEXT');
  github.gists.getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.send(`The secret key is: ${nacl.util.encodeBase64(key)}`);
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;
  github.gists.get({ id })
    .then((response) => {
      const gist = response.data;
      const gistName = Object.keys(gist.files)[0];
      const gistContent = gist.files[gistName].content;

      const nonce = nacl.util.decodeBase64(gistContent.slice(0, 32));
      const encryptedContent = nacl.util.decodeBase64(gistContent.slice(32, gistContent.length));
      const plainText = nacl.secretbox.open(encryptedContent, nonce, key);
      console.log(plainText);
      res.json(nacl.util.encodeUTF8(plainText));
    })
    .catch((err) => {
      res.json(err);
    });


});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { name, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const encryptedContent = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const nonceAndEncryptedContent = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(encryptedContent);

  const files = { [name]: { content: nonceAndEncryptedContent } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response);
    })
    .catch((err) => {
      res.json(err);
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

server.listen(3000, () => {
  console.log('Server listening');
});
