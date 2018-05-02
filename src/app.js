/* eslint-disable */

require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'samscha';
const github = octokit({ debug: true });
const server = express();

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN,
});

const key = nacl.util.decodeBase64(process.env.SECRET_KEY);

server.use(express.json());
server.use(bodyParser.urlencoded({ extended: false }));

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  res.send(`
    <html>
      <header><title>Secret Gists!</title></header>
      <body>
        <h1>Secret Gists!</h1>
        <h2>Supported operations:</h2>
        <ul>
          <li><i><a href="/gists">GET /gists</a></i>: retrieve a list of gists for the authorized user (including private gists)</li>
          <li><i><a href="/key">GET /key</a></i>: return the secret key used for encryption of secret gists</li>
          <li><i>GET /secretgist/ID</i>: retrieve and decrypt a given secret gist
          <li><i>POST /create { name, content }</i>: create a private gist for the authorized user with given name/content</li>
          <li><i>POST /createsecret { name, content }</i>: create a private and encrypted gist for the authorized user with given name/content</li>
        </ul>
        <h3>Create an *unencrypted* gist</h3>
        <form action="/create" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist</h3>
        <form action="/createsecret" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
  `);
});

server.get('/gists', (req, res) => {
  github.gists
    .getAll()
    .then(result => {
      const ids = result.data.map(gist => gist.id);

      // res.send(ids);
      // return;

      Promise.all(
        ids.map(
          id =>
            new Promise((resolve, reject) =>
              github.gists
                .get({ id })
                .then(result => resolve(result))
                .catch(err => reject(err)),
            ),
        ),
      )
        .then(values =>
          res.send(
            values.map(gist => Object.values(gist.data.files)[0].content),
          ),
        )
        .catch(err => res.status(500).send({ err }));
    })
    .catch(err => res.status(500).send({ err }));
});

server.get('/key', (req, res) => {
  res.send({ key: nacl.util.encodeBase64(key) });
});

server.get('/secretgist/:id', (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(422).send({ message: `ID not supplied` });
    return;
  }

  github.gists
    .get({ id })
    .then(result => {
      const ciphertext = Object.values(result.data.files)[0].content;
      const box = nacl.util.decodeBase64(ciphertext);
      const nonce = new Uint8Array(24);
      const secretbox = new Uint8Array(box.length - nonce.length);

      for (let i = 0; i < nonce.length; i++) {
        nonce[i] = box[i];
      }

      for (let i = 0; i < secretbox.length; i++) {
        secretbox[i] = box[i + nonce.length];
      }

      const message = nacl.secretbox.open(secretbox, nonce, key);

      if (message === null) {
        res.status(401).send({ message: `Authentication failed` });
        return;
      }

      res.send(nacl.util.encodeUTF8(message));
    })
    .catch(err =>
      res.status(500).send({
        message:
          Object.keys(err).length > 0
            ? `Error retrieving ID (${id}) from github`
            : `Not a secret gist.`,
        err: Object.keys(err).length > 0 ? err : undefined,
      }),
    );
});

server.post('/create', (req, res) => {
  const { name, content } = req.body;

  if (!name || !content) {
    res.status(422).send({ message: `name and/or content not supplied` });
    return;
  }

  github.gists
    .create({ files: { [name]: { content } }, public: false })
    .then(result => res.send({ ID: result.data.id }))
    .catch(err =>
      res.status(500).send({ message: `Error creating gist`, err }),
    );
});

server.post('/createsecret', (req, res) => {
  const { name, content } = req.body;

  if (!name || !content) {
    res.status(422).send({ message: `name and/or content not supplied` });
    return;
  }

  const nonce = nacl.randomBytes(24);
  const secret = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);

  const secretWithNonce = new Uint8Array(nonce.length + secret.length);

  for (let i = 0; i < nonce.length; i++) {
    secretWithNonce[i] = nonce[i];
  }

  for (let i = 0; i < secret.length; i++) {
    secretWithNonce[i + nonce.length] = secret[i];
  }

  github.gists
    .create({
      files: {
        [name]: {
          content: nacl.util.encodeBase64(secretWithNonce),
        },
      },
      public: false,
    })
    .then(result => res.send({ ID: result.data.id }))
    .catch(err =>
      res.status(500).send({ message: `Error creating gist`, err }),
    );
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
