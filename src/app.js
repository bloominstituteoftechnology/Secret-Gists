/*eslint-disable*/
require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const morgan = require('morgan');
const cors = require('cors');

const username = 'dresean'; // TODO: Replace with your username
const github = octokit({ debug: true });
const server = express();

const port = process.env.PORT || 3000;

server.use(morgan('dev'));

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});



// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.

// TODO:  Attempt to load the key from config.json.  If it is not found,
// create a new 32 byte key.

try {
	const data = fs.readFileSync('./config.json');

	// Read the key from the file
	const keyObject = JSON.parse(data);
	secretKey = nacl.util.decodeBase64(keyObject.secretKey);
} catch (err) {
	// Key not found in file, so write it to the file
	secretKey = nacl.randomBytes(32);
	const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };

	fs.writeFile('./config.json', JSON.stringify(keyObject, null, 4), (ferr) => {
		if (ferr) {
			console.log('Error saving config.json: ' + ferr.message);
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

/*
 GITHUB_TOKEN=fa;dskfhj;lkdsjfkl;jasdl;kfjks
*/

server.get('/keyPairGen', (req, res) => {
  // TODO:  Generate a keypair from the secretKey and display both
  keypair = nacl.box.keyPair();
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
  res.send(nacl.util.encodeBase64(secretKey));
});

server.get('/setkey:keyString', (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString;

  try {
    // TODO:
    secretKey = nacl.util.decodeBase64(keyString);
    res.send(`the key is ${nacl.util.encodeBase64(secretKey)}`);
  } catch (err) {
    // failed
    res.send('Failed to set key.  Key string appears invalid.');
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;
  const gist = req.body;

  // get the gist id
  // take the filename and select the first key from that object
  github.gist.get({id})
  .then(response => {
    console.log(response)
   // response = decodedResponse 
   cipherText.split(' ')[0] 
   console.log (response.ciphertext);
   console.log(response.blob);
   console.log(respone.blob.split(' ')[0]);
   const message = nacl.util.decodeBase64(response.blob);
   const nonce = nacl.util.decodeBase64(response.nonce);
   const decoded = nacl.secretbox.open( message, nonce, secretKey)
    res.json(response)
  })
  .catch(err => err.message)
}); 

server.post('/create', urlencodedParser, (req, res) => {
  // Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists.create({files, public: false})
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

const { name, content } = req.body;
const nonce = nacl.randomBytes(24);
const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, secretKey);
const blob = nacl.util.encodeBase64(ciphertext) + ' ' + nacl.util.encodeBase64(nonce);
const files = { [name]: { content: blob } }
github.gists.create({files, public: false})
.then(response => res.json(response.data))
.catch(err => res.json(err.message))
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // using someone else's public key that can be accessed and
  // viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename
  const { name, content, publicKeyString } = req.body;
  const messageKey = nacl.sign.keyPair();
  const secretMessageKey = messageKey.secretKey;
  const publicMessageKey = messageKey.publicKey;
  const secretMessage = nacl.sign(nacl.util.decodeUTF8(content), secretMessageKey);
  const files = { [name]: { content: secretMessage }}
  github.gists.create({files, public: false }).then(response => res.send(response.data)).catch(err => res.send("you have entered the wrong public key", err));
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
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/

server.listen(port, () => console.log(`server listening to ${port}`));
