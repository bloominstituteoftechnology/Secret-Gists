require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'hillal20'; // TODO: Replace with your username
const github = octokit({ debug: true });
const server = express();
const myKeyString = "barcelona";
// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.


let decodedSecretKey; /// has to be  decoded,  and 32 bytes long 
try {

  const data = fs.readFileSync('./config.json') /// reading the key from the file 
  const keyObject = JSON.parse(data);

  decodedSecretKey = nacl.util.decodeBase64(keyObject.secretKey);  /// decoding the secretKey 


} catch (error) { // we create new key 

  const secretKey = nacl.randomBytes(32); // we create random secret key 
  const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };

  fs.writeFile('./config.json', JSON.stringify(keyObject), (error) => {
    console.log("error saving config.json", error)
  })
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
  let keypair = nacl.box.keyPair(decodedSecretKey);

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
  `);
});

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently Oauthed5 user
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
  res.send(nacl.util.encodeBase64(keypair.secretKey))

});

server.get('/setkey:keyString', (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  let keyString = req.query.keyString;

  try {
    // TODO:

    res.send(nacl.util.encodeBase64(keyString))

  } catch (err) {
    // failed
    res.send('Failed to set key.  Key string appears invalid.');
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  let id = req.query.id;
  // console.log(id);
  github.gists.get({ id })
    .then((response) => {



      // console.log(response.data);
      const p = Object.values(response.data.files)[0]
      //console.log('===>p:', p.content)
      let [nonce, cipherText] = p.content.split(' ');

      cipherText = nacl.util.decodeBase64(cipherText);
      console.log('====>cipherText', cipherText);

      nonce = nacl.util.decodeBase64(nonce);
      console.log('====>nonce ', nonce);

      const content = nacl.secretbox.open(cipherText, nonce, decodedSecretKey);//// always take arrays of numbers 


      res.send(nacl.util.encodeUTF8(content));
    })
    .catch((err) => {
      res.json(err);
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
  // for symmetric encryption we need a nonce , secret key and blob 


  const { name, content } = req.body;


  const nonce = nacl.randomBytes(24); /// we need 24 bytes as required in the assignment 
  const encryptedToArrayOfBytes = nacl.util.decodeUTF8(content); /// we turn content in  array of bytes
  console.log('encry', encryptedToArrayOfBytes)
  const cipherText = nacl.secretbox(encryptedToArrayOfBytes, nonce, decodedSecretKey); // secure the text to a cipherText  via nonce and decoded key and takes arrays of integers 
  console.log('ciphertext', cipherText)
  const blob = nacl.util.encodeBase64(nonce) + ' ' + nacl.util.encodeBase64(cipherText); /// encrypting the nonce and the secure text 
  console.log('===>emcod64', nacl.util.encodeBase64(cipherText));

  const files = { [name]: { content: blob } };
  github.gists.create({ files, public: false })
    .then((response) => {

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


  const { name, content } = req.body;
  const encrypted = nacl.util.encodeUTF8(response)
  const files = { [name]: { content } };
  github.gists.create({ files, public: false })
    .then((response) => {

      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });






});

server.get('/fetchmessagefromfriend:messageString', urlencodedParser, (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID

  let id = req.params.id;
  console.log(id);
  github.gists.get({ id })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });




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

server.listen(3000, () => {
  console.log(`\n=== server is running on 3000 ==`)
});
