const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'justinborek';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();

const parser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
const GITHUB_TOKEN = 'd41c505e4b808ac55250e7252c1d600c3199eae4';

github.authenticate({
  type: 'oauth',
  token: GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
const key = process.env.SECRET_KEY ? nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  res.send(`
    <html>
      <header><title>Secret Gist Demo</title></header>
      <body style="text-align:center">
        <h1>Secret Gist Demo</h1>
        <h2>Paths</h2>
        <ul>
          <li><i><a href="/gists">/gists</a></i>: This is a GET that retrieves the list of all gists for the user</li>
          <li><i><a href="/key">/key</a></i>: This is a GET that returns the secret key used for secret gist encryption.</li>
          <li><i>/secretgist/ID</i>: This is a GET that retrieves and decrypts the gist at the provided ID
          <li><i>/create</i>: This is a POST that creates a gist for the user with the form data in { title, content } format, accessed by the "Create Unencrypted Gist" button</li>
          <li><i>/createsecret</i>: This is a POST that encrypts and creates a gist for the user with the form data in { title, content } format, accessed by the "Create Encrypted Gist" button</li>
        </ul>
        <form method="post">
          Title: <input type="text" name="title"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input onclick='this.form.action="/create";' type="submit" value="Create Unencrypted Gist">
          <input onclick='this.form.action="/createsecret";' type="submit" value="Create Encrypted Gist">
      </body>
    </html>
  `);
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
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
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;
  github.gists.get({ id })
    .then((response) => {
      const data = response.data;
      const title = Object.keys(data.files)[0];
      const blob = data.files[title].content;
      const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
      const decodedText = nacl.util.decodeBase64(blob.slice(32, blob.length));
      const text = nacl.secretbox.open(decodedText, nonce, key);
      res.send(nacl.util.encodeUTF8(text));
    });
});

server.post('/create', parser, (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const { title, content } = req.body;
  const files = { [title]: { content } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/createsecret', parser, (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { title, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const text = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(text);
  const files = { [title]: { content: blob } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    })
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
