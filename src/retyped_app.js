/* eslint-disable no-console */

// configure a .env
require('dotenv').config();
// file system
const fs = require('fs');
// In order to read HTTP POST data , we have to use "body-parser"
// node module.body-parser is a piece of express middleware that reads
// a form's input and stores it as a javascript object accessible through
// req.body
const bodyParser = require('body-parser');
// web framework for Node.js
const express = require('express');
// GitHub REST API client for Node.js
const octokit = require('@octokit/rest');
// high-security cryptographic library
const nacl = require('tweetnacl');
// string encoding/decoding utilities
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
    // error handling
    if (error) {
      // descriptive error message with a detailed error log to go with it
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
    // for this github user(username is in .env)
    .getForUser({ username })
    // the response is the user's gists
    .then((response) => {
      res.json(response.data);
    })
    // catch an error, should there be one
    .catch((err) => {
      res.json(err);
    });
});

// Display the secret key used for encryption of secret gists
server.get('/key', (req, res) => {
  // Send an encoded secret key as the response
  res.send(nacl.util.encodeBase64(secretKey));
});

// Set the key to the one specified by the user or display an error if invalid
server.get('/setkey:keyString', (req, res) => {
  // User input
  const keyString = req.query.keyString;
  try {
    // set secretKey variable to be whatever the user passed in
    secretKey = nacl.util.decodeUTF8(keyString);
    // encode it
    const keyObj = { secretKey: nacl.util.encodeBase64(secretKey) };
    // write keyObj to config.json
    fs.writeFile('./config.json', JSON.stringify(keyObj), (error) => {
      // let user know if theres an error with a message and more detailed error logging
      if (error) {
        console.log('Error writing Secret Key to the config file. More Details: ', error.message);
        return;
      }
    });
    // send some html to display the encoded key
    res.send(`<div>Key set to new value: ${keyString}</div>`);
  } catch (err) { // catch the error, send a message explaining the error
    res.send('Failed to set Key. Key String appears invalid');
  }
});

// Retrieve and decrypt the secret gist corresponding to the given ID
server.get('/fetchmessagefrommyself:id', (req, res) => {
  // destructure the ID
  const id = req.query.id;
  // access the authorized user's gists
  github.gists
    // get the specific gist fed into the endpoint
    .get({ id })
    .then((response) => {
      // assign the data to a variable named gist
      const gist = response.data;
      // assume the gist only contains one file
      const filename = Object.keys(gist.files)[0];
      // put the gist content on a variable
      const encryptedContent = gist.files[filename].content;
      // decode the encrypted content
      const decrypted = nacl.util.decodeBase64(encryptedContent);
      // the decrypted content needs to be spilt
      // nonce is the first 24 bytes; splice that many bytes off
      // 24 bytes translates to 32 characters once we encode in base64
      const nonce = decrypted.slice(0, 24);
      const messageContent = decrypted.slice(24);
      // open the secretbox
      const gistContent = nacl.secretbox.open(messageContent, nonce, secretKey);
      // convert content to a string and send it
      res.send(nacl.util.encodeUTF8(gistContent));
    })
    // basic catch error handling
    .catch((err) => {
      console.log(err);
      res.send(err);
    });
});

// Create a private gist with name and content given in post request
server.post('/create', urlencodedParser, (req, res) => {
  // recieves name and content input
  const { name, content } = req.body;
  // formats it for Github
  const files = { [name]: { content } };
  github.gists
    // create the gist and make it private
    .create({ files, public: false })
    // send it to github
    .then((response) => {
      res.json(response.data);
    })
    // catch an error
    .catch((err) => {
      res.json(err);
    });
});

// Create a private and encrypted gist with given name/content
server.post('/createsecret', urlencodedParser, (req, res) => {
  // read the name and content off the url params
  const { name, content } = req.body;
  // initialize a nonce as a random 24 byte string
  const nonce = nacl.randomBytes(24);
  // decode the UTF8 content and then encrypt it
  const cipherTxt = nacl.secretbox(nacl.util.decodeBase64(content), nonce, secretKey);
  // the nonce needs to be persisted until we are looking to decrypt this content
  // Append (or prepend) the nonce to the encrypted content
  const encryptedContent = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(cipherTxt);
  // format the content for the Github API
  const file = { [name]: { content: encryptedContent } };
  github.gists
    // using the formatted content, create the file
    .create({ files: file, public: false })
    // send it up to Github
    .then((response) => {
      res.json(response.data);
    })
    // catch an error
    .catch((err) => {
      res.json(err);
    });
});
