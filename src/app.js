const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'alexcassell';
const github = new GitHubApi({ debug: true });
const server = express();

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

const key = process.env.SECRET_KEY ?
  nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);


server.get('/gists', (req, res) => {
  github.gists.getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      res.json(error);
    });
});

server.get('/key', (req, res) => {
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', (req, res) => {
  const id = req.params.id;
  github.gists.get({ id }).then((response) => {
    const gist = response.data;
    const filename = Object.keys(gist.files)[0];
    const blob = gist.files[filename].content;
    const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
    const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length));
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
    res.send(nacl.util.encodeUTF8(plaintext));
  }).catch((err) => { res.json(err); });
});

server.post('/create', urlencodedParser, (req, res) => {
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists.create({ files, public: false })
    .then((response) =>
          {
          res.json(response.data);
  })
  .catch((err) => {
    res.json(err);
  });
});


server.post('/createsecret', (req, res) => {
  const { name, content, description } = req.body;
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  github.gists.create({ public: false, description, files: { [name]: { content: blob } } })
    .then((response) => { res.json(response.data); })
    .catch((err) => { res.json(err); });
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
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