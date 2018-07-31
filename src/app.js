/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'annecourtney'; // TODO: Replace with your username
// The object you'll be interfacing with to communicate with github
const github = octokit({ debug: true });
const server = express();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// 1. try to read .env file
// 2. if the .env file exists and the key is there, initialize secret key
// 3. if we fail to read the .env, generate a new random secret key
// let secretKey;

// try {
//   // trying to read the .env file
//   const data = fs.readFileSync('./.env');
//   // parse through the data inside .env
//   const keyObject = JSON.parse(data);
//   secretKey = nacl.util.decodeBase64(keyObject.secretKey);
// } catch (err) {
//   secretKey = nacl.randomBytes(32);
//   // create the keyObject
//   const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };

//   // write this keyobject to .env
//   fs.appendFile('./.env', JSON.stringify(keyObject), (ferr) => {
//     if (ferr) {
//       return;
//     }
//   });
// }
let secretKey;
let keyPair;

fs.readFile('./config.json', (noConfig, data) => {
  // try to load key from config.json
  // if error, create a 32 byte key with nacl
  // create key object with secretKey as a key and the output of Base64 encoding of the key as value
  if (noConfig) {
    if (!process.env.SECRET_KEY) {
      secretKey = nacl.randomBytes(32);
      keyPair = { secretKey: nacl.util.encodeBase64(secretKey) };
      fs.appendFile('./.env', `\nSECRET_KEY=${keyPair.secretKey}`, (error) => {
        if (error) throw error;
      });
    }
    // else if data can be loaded from config.json,
    // keyObject is parsed JSON data from ./config.json
    // secretKey is decoded Base64 of the key secretKey on the keyObject object
  } else {
    keyPair = JSON.parse(data);
    secretKey = nacl.util.decodeBase64(keyPair.secretKey);
    if (!process.env.SECRET_KEY) {
      secretKey = nacl.util.encodeBase64(secretKey);
      fs.appendFile('./.env', `\nSECRET_KEY=${keyPair.secretKey}`);
    }
  }
});


server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  res.send(`
    <html>
      <header><title>Secret Gists!</title></header>
      <body>
        <h1>Secret Gists!</h1>
        <div>This is an educational implementation.  Do not use for truly valuable information</div>
        <h2>Supported operations:</h2>
        <ul>
          <li><i><a href="/keyPairGen">Show Keypair</a></i>: generate a keypair from your secret key.  Share your public key for other users of this app to leave encrypted gists that only you can decode with your secret key.</li>
          <li><i><a href="/gists">GET /gists</a></i>: retrieve a list of gists for the authorized user (including private gists)</li>
          <li><i><a href="/key">GET /key</a></i>: return the secret key used for encryption of secret gists</li>
        </ul>
        <h3>Set your secret key to a specific key</h3>
        <form action="/setkey:keyString" method="get">
          Key String: <input type="text" name="keyString"><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *unencrypted* gist</h3>
        <form action="/create" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for yourself</h3>
        <form action="/createsecret" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Retrieve an *encrypted* gist you posted for yourself</h3>
        <form action="/fetchmessagefromself:id" method="get">
          Gist ID: <input type="text" name="id"><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for a friend to decode</h3>
        <form action="/postmessageforfriend" method="post">
          Name: <input type="text" name="name"><br>
          Friend's Public Key String: <input type="text" name="publicKeyString"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Retrieve an *encrypted* gist a friend has posted</h3>
        <form action="/fetchmessagefromfriend:messageString" method="get">
          String From Friend: <input type="text" name="messageString"><br>
          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
  `);
});

server.get('/keyPairGen', (req, res) => {
  // TODO:  Generate a keypair from the secretKey and display both
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey);

  // Display both keys as strings
  res.send(`
    <html>
      <header><title>Keypair</title></header>
      <body>
        <h1>Keypair</h1>
        <div>Share your public key with anyone you want to be able to leave you secret messages.</div>
        <div>Keep your secret key safe.  You will need it to decode messages.  Protect it like a passphrase!</div>
        <br/>
        <div>Public Key: ${nacl.util.encodeBase64(keypair.publicKey)}</div>
        <div>Secret Key: ${nacl.util.encodeBase64(keypair.secretKey)}</div>
      </body>
    </html>
  `);
});

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO: Display the secret key used for encryption of secret gists
  // 1. encode our secretkey back to base64
  // 3. send it as our response
  res.send(nacl.util.encodeBase64(secretKey));
});

server.get('/setkey:keyString', (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString;
  try {
    // TODO:
    // set our secretkey var to be whatever the user passed in
    secretKey = nacl.until.decodeUTF8(keyString);

    const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };

  // write this keyobject to .env
    fs.writeFile('./.env', JSON.stringify(keyObject), (ferr) => {
      if (ferr) {
        return;
      }
    });
    res.send(`<div>Key set to new value: ${keyString}</div>`);
  } catch (err) {
    // failed
    res.send('Failed to set key.  Key string appears invalid.');
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.query.id;

  github.gists.get({ id })
    .then((response) => {
      const gist = response.data;
      const filename = Object.keys(gist.giles)[0];
      const blob = gist.files[filename].content;
      let nonce = blob.slice(0, 32);
      let ciphertext = blob.slice(32, blob.length);
      nonce = nacl.util.decodeBase64(nonce);
      ciphertext = nacl.util.decodeBase64(ciphertext);
      const plaintext = nacl.secretbox.open(ciphertext, nonce, secretKey);
      res.send(nacl.util.encodeUTF8(plaintext));
    })
    .catch((err) => {
      res.json((err));
    });
});

server.post('/create', urlencodedParser, (req, res) => {
  // Create a private gist with name and content given in post request
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

server.post('/createsecret', urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // Read name and content of url parameters
  const { name, content } = req.body;
  // initialize a nonce
  const nonce = nacl.randomBytes(24);

  // encrypt the UTF8 content and encrypt it
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, secretKey);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  const files = { [name]: { content: blob } };

  github.gists.create({ files, public: false })
    .then((response) => {
      console.log(response.data);
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // using someone else's public key that can be accessed and
  // viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename
});

server.get('/fetchmessagefromfriend:messageString', urlencodedParser, (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
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
  - Pretty templates! More forms!
  - Better management of gist IDs, use/display other gist fields
  - Support editing/deleting existing gists
  - Switch from symmetric to asymmetric crypto
  - Exchange keys, encrypt messages for each other, share them
  - Let the user pass in their private key via POST
*/

server.listen(3000);
