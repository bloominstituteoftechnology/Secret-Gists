require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'jesuarva'; // TODO: Replace with your username
// The object you'll be interfacing with to communicate with github
const github = octokit({ debug: true });
const server = express();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Require Crypto
const crypto = require('crypto');
let hash256 = crypto.createHash('sha256');

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN,
});

// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.

let privateKey;

try {
  const config = require('../config.json');
  privateKey = config.key ? nacl.util.decodeBase64(config.key) : nacl.randomBytes(32);
  console.log(privateKey);
} catch (error) {
  /* if there are not config.json file */
  // Generates a random Unit8Array of 32 bytes
  const randomValue = nacl.randomBytes(32);
  // pass it to Base64 -> a mor human redable encoding.
  const keyBase64 = nacl.util.encodeBase64(randomValue);
  // put it in an object -> this will be the content of the config.json
  const configFileContent = {
    key: keyBase64,
    keyLength: keyBase64.length,
    keyUnit8Array: randomValue,
    keyUnit8ArrayLenght: randomValue.length,
  };
  // Create the file in the root-folder with the content created before.
  fs.writeFile('./config.json', JSON.stringify(configFileContent), err => {
    if (err) throw new Error('Fail to write secret to file');
  });

  // Pass a reference to the Unit8Array to the 'secretKey' variable -> so we can refer to that later on the code.
  privateKey = randomValue;
}

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
  github.gists
    .getForUser({ username })
    .then(response => {
      res.json(response.data);
    })
    .catch(err => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO: Display the secret key used for encryption of secret gists
  const privateKeyString = nacl.util.encodeBase64(privateKey);
  res.status(200).json({ secretKey: privateKeyString });
});

server.get('/setkey:keyString', (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString;
  try {
    // TODO:
    // console.log(keyString.length > 32);
    if (keyString.length > 32) {
      throw new Error();
    } else {
      // console.log('1');
      privateKey = nacl.util.decodeBase64(keyString);
      // console.log('2');
      res.status(200).json('New secret key created');
      // console.log('3');
    }
  } catch (err) {
    // failed
    console.log(err);
    res.send(
      'Failed to set key.  Key string appears invalid. allowed alfanumeric characters: A-Z, a-z and 0-9.\n Minimun 4 characters'
    );
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  // gist ID "33da85f913935ef9ba27c00d1db55365"
});

server.post('/create', urlencodedParser, createdPrivateGist);

server.post('/createsecret', urlencodedParser, encodeBody, createdPrivateGist);

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

/**
 * UTILS: helper functions
 */
function saltSecretKey(key) {
  // TODO: Salt a passed 'key' so its length will be 32 bytes.
  if (key.length < 32) {
    const salt = 32 - key.length;
    const saltBytes = nacl.randomBytes(salt);
    console.log('SALT TO 32', key, saltBytes);
    const saltString = nacl.util.encodeBase64(saltBytes); // Do not 'encode' with encodeUTF8 -> will fail and throw an Error.
    console.log('SALT TO 32', key, saltString);
    // key = key.split(' ').join('0');
  } else if (key.length > 32) {
    throw new TypeError('Key is too large. Max size is 32 characters');
  }
  return nacl.util.decodeBase64(key);
}

function createdPrivateGist(req, res) {
  // Create a private gist with name and content given in post request
  const { name, content } = req.body;
  console.log(name, content);
  const files = { [name]: { content } };
  github.gists
    .create({ files, public: false })
    .then(response => {
      res.json(response.data);
    })
    .catch(err => {
      res.json(err);
    });
}
function encodeBody(req, res, next) {
  // TODO:  Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  console.log(Object.keys(req));
  console.log(req.body);
  const { name, content } = req.body;
  const contentInBytes = nacl.util.decodeUTF8(content);

  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.secretbox(contentInBytes, nonce, privateKey);
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  req.body.content = blob;
  next();
}

server.listen(3000);
