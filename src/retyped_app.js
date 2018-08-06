/* eslint-disable no-console */

// configure a .env
require('dotenv').config();

// Dependency Variable Index
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

// for privacy, username is stored in .env
const username = process.env.USER_NAME;
// create a github variable to interface with to communicate with Github
const github = octokit({ debug: true });
// create a server variable to use express() with
const server = express();
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// initalize Secret and Public Key variables
let secretKey;
let publicKey;

// Generate an access token on Github.com and put it
// in .env and use that to authenticate a session
github.authenticate({
  type: 'oauth',
  token: process.env.GUTHUB_TOKEN
});

// Load a Secret Key in config.json.
// If config.json doesn't have a Secret key, create a new 32 byte key.
// 1. Try and read config.json
// 2. If config.json exists with a key indside, init a `secretKey` variable
// 3. Generate a new config.json and/or a random Secret Key if one or both do not exist.
try {
  // try to read config.json, and put the data it reads on a data variable
  const data = fs.readFileSync('./config.json');
  // parse the data read from config.json, and put it on a keyObj variable
  const keyObj = JSON.parse(data);
  // decode the key from the config.json as a secretKey variable.
  secretKey = nacl.util.decodeBase64(keyObj.secretKey);
} catch (err) { // the catch in a try/catch is for if the `try` section fails to run
  // generate a random key comprised of 32 bytes
  secretKey = nacl.randomBytes(32);
  // encode the newly generated secret key as a string
  const keyObj = { secretKey: nacl.util.encodeBase64(secretKey) };
  // create a config.json populated with the encoded secret key.
  fs.writeFile('./config.json', JSON.stringify(keyObj), (error) => {
    if (error) {
      console.log('Error writing secret key to the Config file. More Details: ', error.message);
      return;
    }
  });
}

// The Main HTML at localhost:
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

// Generate a keypair from the secretKey and display both
server.get('/keyPairGen', (req, res) => {
  // initialize a keypair variable that is generated from nacl.box
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
  // pull the public key off of the keypair object
  publicKey = keypair.publicKey;
  // send back some HTML with the keys encoded as strings
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

// Retrieve a list of all gists for the current authorized user
server.get('/gists', (req, res) => {
  // the github object has access to the user's data
  github.gists
    .getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});
