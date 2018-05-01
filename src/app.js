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
// const key = nacl.util.decodeBase64(secret);

server.use(express.json());

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

      res.send(ids);
      // return;

      //   Promise.all(
      //     ids.map(
      //       id =>
      //         new Promise((resolve, reject) =>
      //           github.gists
      //             .get({ id })
      //             .then(result => resolve(result))
      //             .catch(err => reject(err)),
      //         ),
      //     ),
      //   )
      //     .then(values =>
      //       res.send(
      //         values.map(gist => Object.values(gist.data.files)[0].content),
      //         // `<html>
      //         // <header><title>All Gists!</title></header>
      //         // <body>
      //         // <ul>
      //         //   <li>${values.map(
      //         //     gist => Object.values(gist.data.files)[0].content,
      //         //   )}</li>
      //         // </ul>
      //         // </body>
      //         // </html>
      //         // `,
      //       ),
      //     )
      //     .catch(err => res.status(500).send({ err }));
    })
    .catch(err => res.status(500).send({ err }));
});

server.get('/key', (req, res) => {
  res.send({ key });
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
      // res.send(Object.values(result.data.files)[0].content)
      const ciphertext = Object.values(result.data.files)[0].content;
      // console.log('ciphertext', ciphertext);
      const box = nacl.util.decodeBase64(ciphertext);
      // console.log('box', box);
      // console.log('box length', box.length);

      const nonce = new Uint8Array(24);
      const secretbox = new Uint8Array(box.length - nonce.length);

      for (let i = 0; i < nonce.length; i++) {
        nonce[i] = box[i];
      }

      for (let i = 0; i < secretbox.length; i++) {
        secretbox[i] = box[i + nonce.length];
      }

      // console.log('nonce', nonce);
      // console.log('nonce length', nonce.length);
      // console.log('secretbox', secretbox);
      // console.log('secretbox length', secretbox.length);

      const message = nacl.secretbox.open(secretbox, nonce, key);

      // console.log('message', message);

      if (message === null) {
        res.status(401).send({ message: `Authentication failed` });
        return;
      }

      res.send(nacl.util.encodeUTF8(message));
    })
    .catch(err =>
      res
        .status(500)
        .send({ message: `Error retrieving ID (${id}) from github`, err }),
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
  // console.log('content', content);
  // console.log('nonce', nonce);
  // console.log('key', key);

  const encryptedContent = nacl.secretbox(
    nacl.util.decodeUTF8(content),
    nonce,
    key,
  );

  const encrypedContent_with_nonce = new Uint8Array(
    nonce.length + encryptedContent.length,
  );

  for (let i = 0; i < nonce.length; i++) {
    encrypedContent_with_nonce[i] = nonce[i];
  }

  for (let i = 0; i < encryptedContent.length; i++) {
    encrypedContent_with_nonce[i + nonce.length] = encryptedContent[i];
  }

  // console.log('encryped content w/ nonce', encrypedContent_with_nonce);
  // console.log(
  //   'encryped content w/ nonce length',
  //   encrypedContent_with_nonce.length,
  // );

  github.gists
    .create({
      files: {
        [name]: {
          content: nacl.util.encodeBase64(encrypedContent_with_nonce),
        },
      },
      public: false,
    })
    .then(result => res.send({ ID: result.data.id }))
    .catch(err =>
      res.status(500).send({ message: `Error creating gist`, err }),
    );

  // res.send({
  //   message: nacl.util.encodeBase64(encrypted_content),
  //   nonce: nacl.util.encodeBase64(nonce),
  // });
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
