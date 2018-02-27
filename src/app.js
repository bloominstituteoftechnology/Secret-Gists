const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

require('dotenv').config();

const username = 'Lambdarines'; // TODO: your GitHub username here
const github = new GitHubApi({
  debug: true,
});
const server = express();
const token = process.env.GITHUB_TOKEN;
let client_id = '';
// console.log('token', token);

let myPublicKey;

server.use(bodyParser.json());

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token,
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
// const secretKey = Uint8Array.from(process.env.SECRET_KEY);
// const nonce = process.env.NONCE;

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  github.users
    .getForUser({
      username,
    })
    .then(response => {
      res.json(response.data);
      console.log('client id', response.data.id);
      client_id = response.data.id;
      // console.log(response.data);
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
  try {
    github.users.getKey({
      id: '36865507',
    });
  } catch (error) {
    console.log(error);
  }
  // {
  //   res.json({
  //     catchError: true,
  //     error
  //   })
  // }
});

server.get('/secretgist/:id', (req, res) => {
  try {
    // TODO Retrieve and decrypt the secret gist corresponding to the given ID
    let id = '44be398986b3e2d5936ee133dcce62d2';
    github.gists
      .get({
        id,
      })
      .then(response => {
        let signedMessage = new Uint8Array(
          res.json(response.data.files['file4.txt'].content)
        );
        nacl.sign.open(signedMessage, myPublicKey);
      });
  } catch (error) {
    res.json({
      catchError: true,
      error,
    });
  }
});

server.post('/create', (req, res) => {
  github.gists.create(
    {
      key: 'key',
      public: true,
      description: 'My first gist',
      files: {
        'file1.txt': {
          content: "Aren't gists great!",
        },
      },
    },
    () =>
      res.json({
        status: 'done',
      })
  );
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  let pair = nacl.sign.keyPair();

  let publicKey = nacl.sign.keyPair.fromSecretKey(pair.secretKey);
  myPublicKey = publicKey;

  let message = new Uint8Array('encrypt the stupid thing!');
  let encMessage = nacl.sign(message, pair.secretKey);
  // nacl.sign(message, pair.secretKey);
  github.gists.create(
    {
      public: false,
      description: 'a secret gist',
      files: {
        'file4.txt': {
          content: encMessage.toString(),
        },
      },
    },
    () =>
      res.json({
        status: 'done',
      })
  );
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
