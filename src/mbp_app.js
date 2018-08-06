/* eslint-disable no-console */
console.log("test")

require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
// nacl or salt is what we use to encrypt data
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = process.env.GITHUB_USERNAME;
const github = octokit({ debug: true });
const server = express();

const urlencoderParser = bodyParser.urlencoded({ extended: false })

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

let secretKey;

try {
  // try to read the config file
  const data = fs.readFileSync('./config.json');
  //parse the data that we read from the json file
  const keyObject = JSON.parse(data);
  secretKey = nacl.util.decodeBase64(keyObject.secretKey);
} catch (err) {
  //if secretKey doesn't exist, it can't be read. This will start the catch block where we create a secret Key
  secretKey = nacl.randomBytes(32);
  //Create the keyObject, encoding the secretKey as a string
  const keyObject = { secretKey: nacl.util.encodedBase64(secretKey) };
  //Write this keyObject to config.json
  fs.writeFile('/config.json', JSON.stringify(keyObject), (err) => {
    if (err) {
      console.log('Error writing secret key to config this ', err.message);
      return;
    }
  });
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
          Key String: <input type="text" name="keyString">

          <input type="submit" value="Submit">
        </form>
        <h3>Create an *unencrypted* gist</h3>
        <form action="/create" method="post">
          Name: <input type="text" name="name">

          Content:
<textarea name="content" cols="80" rows="10"></textarea>

          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for yourself</h3>
        <form action="/createsecret" method="post">
          Name: <input type="text" name="name">

          Content:
<textarea name="content" cols="80" rows="10"></textarea>

          <input type="submit" value="Submit">
        </form>
        <h3>Retrieve an *encrypted* gist you posted for yourself</h3>
        <form action="/fetchmessagefromself:id" method="get">
          Gist ID: <input type="text" name="id">

          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for a friend to decode</h3>
        <form action="/postmessageforfriend" method="post">
          Name: <input type="text" name="name">

          Friend's Public Key String: <input type="text" name="publicKeyString">

          Content:
<textarea name="content" cols="80" rows="10"></textarea>

          <input type="submit" value="Submit">
        </form>
        <h3>Retrieve an *encrypted* gist a friend has posted</h3>
        <form action="/fetchmessagefromfriend:messageString" method="get">
          String From Friend: <input type="text" name="messageString">

          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
  `);
});

server.get('/keyPairGen', (req, res) => {
  //this generates a keypair from the secretKey and display both
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
  
  // display both keys as strings
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

server.get('/gists', (req,res) => {
  // Retrieve a list of all the gists for the currrently authed user
  github.gists // gets your data in a object, and look intt he gists property
    .getForUser({ username }) // searches for user by username
    .then(response => {
      res.json(response.data); //returns a promise that parses data into json
    })
    .catch(err => {
      res.json(err); //returns a error
    });
});

server.get('/key', (req, res) => {
  //encodes our secretKey and sends it as a response object
  res.send(nacl.util.encodeBase64(secretKey));
});

server.get('/setkey:keyString', (req,res) => {
  const keyString = req.query.keyString;
  try {
  const keyObject = nacl.util.decodeUFT8(keyString);
  fs.writeFile('./config.json', JSON.stringify(keyObject), err => {
    if (err) {
      console.log('Error writing secret key to config file ', err.message);
      return;
    }
  });
    res.send(`<div>Key set to new value: ${keyString}</div>`);
  } catch (err) {
    res.send('Failed to set key. Key string appears invalid');
    }
  });