require('dotenv').config(); // Reminder to create a .env file to add variables to.
const fs = require('fs'); // File system node.js module that allows us to interact with the file system
const bodyParser = require('body-parser'); // module to extract the body portion of an incoming request stream and expose it on req.body
const express = require('express'); // importing the express framework
const octokit = require('@octokit/rest'); // Github API
const nacl = require('tweetnacl'); // for client side encryption using the various methods available.
nacl.util = require('tweetnacl-util'); // provides utilities for encoding/decoding  between strings and bytes

const username = process.env.USERNAME; // username
const github = octokit({ debug: true }); // The object you'll be interfacing with to communicate with github
const server = express(); // creating an express application/server

const urlencodedParser = bodyParser.urlencoded({ extended: false }); // Create application/x-www-form-urlencoded parser

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
}); // Generate an access token: http://github.com/settings/tokens; Set it to be able to create gists

let secretKey;
try {
  const data = fs.readFileSync('./config.json'); // reading the file config.json storing it to data variable
  const keyObject = JSON.parse(data); // parse data into JSON
  secretKey = nacl.util.decodeBase64(keyObject.secretKey);
} catch (err) {
  secretKey = nacl.randomBytes(32); // if key is not found create a new 32 byte key
  const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };
  fs.writeFile('./config.json', JSON.stringify(keyObject), (ferr) => {
    // write this new keyObject key pair to config.json
    if (ferr) {
      // if file error print to console this message
      process.stdout.write(
        'Error writing secret key to config file: ',
        ferr.message
      );
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
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey); // creating a keypair that includes a public key created from my secret key from above
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
  `); // Display both keys as strings
});

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  github.gists
    .getForUser({ username }) // grabbing gists for user with username passed in
    .then((response) => {
      // returns a promise that we treat with then and catch; if successful should return the list of gists
      res.json(response.data);
    })
    .catch((err) => {
      // in case of error
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  res.send(nacl.util.encodeBase64(secretKey)); // displays the secret key used for encryption of secret gists;
});

server.get('/setkey:keyString', (req, res) => {
  // Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString; // getting the keystring from the url parameter
  try {
    secretKey = nacl.util.decodeUTF8(keyString); // decode the keystring back into a Uint8array
    const keyObject = { secretKey: keyString }; // set key object to contain a secret key equal to the string the user passed in.
    fs.writeFile('./config.json', JSON.stringify(keyObject), (ferr) => {
      // write over the keyObject in config.json
      if (ferr) {
        // error handling in case fs.writeFile is unsuccessful
        process.stdout.write(
          'Error writing secret key to config file: ',
          ferr.message
        );
        return;
      }
    });
    res.send(`<div>Key set to new value: ${keyString}</div>`); // display keyString to the screen on success
  } catch (err) {
    // in case anything in the try block does not work
    res.send('Failed to set key.  Key string appears invalid.');
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.query.id; // getting the id from the url parameter

  github.gists
    .get({ id })
    .then((response) => {
      const gist = response.data; // returning the gist object that corresponds to the given ID
      const filename = Object.keys(gist.files)[0]; // grabbing the first file in the array returned
      const blob = gist.files[filename].content; // grab the encrypted content and nonce
      const nonce = nacl.util.decodeBase64(blob.slice(0, 32)); // nonce is the first 24 bytes; splice that many bytes off the blob (translates to 32 characters onced encoded in Base64)
      const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length)); // grab the cipher text from the rest of the blob
      const plaintext = nacl.secretbox.open(ciphertext, nonce, secretKey); // decrypt the cipher text into plain text (returns Uint8array)
      res.send(nacl.util.encodeUTF8(plaintext)); // send the plaintext in response (encode into a human readable string)
    })
    .catch((err) => {
      res.json({ err });
    });
});

server.post('/create', urlencodedParser, (req, res) => {
  // Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists
    .create({ files, public: false }) // send the post request to the GitHub API
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/createsecret', urlencodedParser, (req, res) => {
  // Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  const { name, content } = req.body;
  // initialize a nonce
  const nonce = nacl.randomBytes(24); // random one time use value used to encrypt and decrypt (like a salt)
  const ciphertext = nacl.secretbox(
    nacl.util.decodeUTF8(content),
    nonce,
    secretKey
  ); // decode the UTF8 content and then encrypt it
  // Somehow the nonce needs to be persisted until we're looking to decrypt this content
  // Append (or prepend) the nonce to our encrypted content
  const blob =
    nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  // format the blob and name in the format that the github API expects
  const file = { [name]: { content: blob } };
  // send the post request to the github API
  github.gists
    .create({ files: file, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
  // Create a private and encrypted gist with given name/content using someone else's public key that can be accessed and viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename
  const { name, content, publicKeyString } = req.body;
  const nonce = nacl.randomBytes(24); // random one time use value used to encrypt and decrypt (like a salt)
  const ciphertext = nacl.box(
    nacl.util.decodeUTF8(content),
    nonce,
    nacl.util.decodeBase64(publicKeyString),
    secretKey
  ); // decode the UTF8 content and Base64 publicKeyString and encrypt it
  const blob =
    nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext); // Append (or prepend) the nonce to our encrypted content
  const file = { [name]: { content: blob } }; // format the blob and name in the format that the github API expects
  github.gists
    .create({ files: file, public: true }) // send the post request to the github API
    .then((response) => {
      const messageString = nacl.util.encodeBase64() + response.data.id;
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get(
  '/fetchmessagefromfriend:messageString',
  urlencodedParser,
  (req, res) => {
    // Retrieve and decrypt the secret gist corresponding to the given ID
  }
);

server.listen(3000);
