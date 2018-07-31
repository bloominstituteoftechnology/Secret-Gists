require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'mister-corn'; // TODO: Replace with your username
const github = octokit({ debug: true });
const server = express();

const updateConfigJson = (newConfig) => {
  try {
    fs.writeFileSync('./src/config.json', JSON.stringify(newConfig));
  } catch (err) {
    console.log('updateConfigJson error state:', err);
    return 1;
  }
  return 0;
};

// Dirty Global State
let state = {
  secretKey: null,
  publicKey: null
};

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.
try {
  // https://stackoverflow.com/a/13060087 for below tip
  // const appRoot = process.cwd();
  // Use this to double check where exactly is the root folder of node's process
  // For example you can console.log it
  // or go `${appRoot}/config.json`, and see the full exact path in the error message 
  const jsonStr = fs.readFileSync('./src/config.json');
  state = JSON.parse(jsonStr);
  state = {
    ...state,
    secretKey: nacl.util.decodeBase64(state.secretKey),
    publicKey: nacl.util.decodeBase64(state.publicKey)
  };
} catch (err) {
  console.log('readFileSync error:', err);
  const { secretKey, publicKey } = nacl.box.keyPair.fromSecretKey(nacl.randomBytes(32));
  state = {
    ...state,
    secretKey,
    publicKey
  };
  const configObj = {
    ...state,
    secretKey: nacl.util.encodeBase64(state.secretKey),
    publicKey: nacl.util.encodeBase64(state.publicKey)
  };
  updateConfigJson(configObj);
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
        <div>Public Key: ${nacl.util.encodeBase64(state.publicKey)}</div>
        <div>Secret Key: ${nacl.util.encodeBase64(state.secretKey)}</div>
        <br/>
        <a href="/">Go back.</a>
      </body>
    </html>
  `);
});

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({ username })
    .then((response) => {
      // res.json(response.data.map(obj => obj.id));
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO: Display the secret key used for encryption of secret gists
  res.send(`
  <html>
    <header><title>Secret Key of Secrets</title></header>
    <body>
      <h1>Secret Key</h1>
      <div>Keep your secret key safe.  You will need it to decode messages.  Protect it like a passphrase!</div>
      <br/>
      <div>Secret Key: ${nacl.util.encodeBase64(state.secretKey)}</div>
      <br/>
      <a href="/">Go back.</a>
    </body>
  </html>
  `);
});

server.get('/setkey:keyString', (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString;
  // TODO:
  const { secretKey, publicKey } = nacl.box.keyPair.fromSecretKey(nacl.util.decodeBase64(keyString));
  state = {
    ...state,
    secretKey,
    publicKey
  };

  const saveResult = updateConfigJson({
    ...state,
    secretKey: nacl.util.encodeBase64(state.secretKey),
    publicKey: nacl.util.encodeBase64(state.publicKey)
  });

  if (saveResult === 1) {
    res.send(`
    <html>
      <header><title>Set keyString</title></header>
      <body>
        <h1>ERROR: set keyString</h1>
        <div>Key is temporarily updated, but could NOT be saved permanently.
          This key will be lost upon server restart. Please ensure you have this key copied.
          <br/>
          Key: ${keyString}
          <br/>
          Keep your secret key safe.  You will need it to decode messages.  Protect it like a passphrase!
        <br/>
        <a href="/">Go back.</a>
      </body>
    </html>
    `);
  } else {
    res.send(`
    <html>
      <header><title>Set keyString</title></header>
      <body>
        <h1>Success!</h1>
        <div>Key set successful.</div>
        <br/>
        <a href="/">Go back.</a>
      </body>
    </html>
    `);
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.query;

  github.gists.get({ id })
    .then((response) => {
      // Grab data from response
      const key = Object.keys(response.data.files)[0];
      const { content, filename } = response.data.files[key];
      // Define inputs
      // First 32 characters: nonce
      // All characters thereafter: encrypted message ('box')
      const nonce = nacl.util.decodeBase64(content.slice(0, 32));
      const box = nacl.util.decodeBase64(content.slice(32));
      // Decrypt message then encode in UTF8
      const result = nacl.secretbox.open(box, nonce, state.secretKey);
      const message = result ? nacl.util.encodeUTF8(result) : null;
      // Render response
      res.send(`
      <html>
        <header><title>${filename} | Gist</title></header>
        <body>
          <h1>${filename}</h1>
          <h2>Gist ID: ${id}</h2>
          <div>
            ${message || '<em>No message. Decryption may have failed.</em>'}
          </div>
          <br/>
          <a href="/">Go home.</a>
        </body>
      </html>
      `);
    })
    .catch((err) => {
      res.json({ err });
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
  const { name, content } = req.body;
  // Generate nonce and cipher version of content
  const nonce = nacl.randomBytes(24);
  const cipherContent = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, state.secretKey);
  // Combine nonce and cipher content into a single string
  const nonceAndCipherContent = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(cipherContent);
  // Create postObject and post to Github Gists
  const files = { [name]: { content: nonceAndCipherContent } };
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
  const { name, content, publicKeyString } = req.body;
  // Generate nonce and cipher version of content. Decode publicKeyString to UInt8 Array.
  const nonce = nacl.randomBytes(24);
  const theirPublicKey = nacl.util.decodeBase64(publicKeyString);
  const cipherContent = nacl.box(nacl.util.decodeUTF8(content), nonce, theirPublicKey, state.secretKey);
  // Combine *personal* public key, nonce, and cipher content into a single string
  // We used our *personal private key* to help encrypt the cipher content.
  // They'll need our *personal public key* to decrypt it.
  const pubkeyNonceCipherContentCombined = nacl.util.encodeBase64(state.publicKey) + nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(cipherContent);

  const files = { [name]: { content: pubkeyNonceCipherContentCombined } };
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
  const { messageString } = req.query;
  // Derive inputs from messageString
  // First 44 characters: publicKey given by sender
  // Next 32 characters: nonce
  // All characters thereafter: encrypted message ('box')
  const theirPublicKey = nacl.util.decodeBase64(messageString.slice(0, 44));
  const nonce = nacl.util.decodeBase64(messageString.slice(44, 76));
  const box = nacl.util.decodeBase64(messageString.slice(76));
  // Decrypt box and encode message to UTF8 (if any)
  const result = nacl.box.open(box, nonce, theirPublicKey, state.secretKey);
  const message = result ? nacl.util.encodeUTF8(result) : null;
  // Render response
  res.send(`
  <html>
    <header><title>Friend's Message Result | Gist</title></header>
    <body>
      <h1>Message from Friend</h1>
      <h2>Decryption Result</h2>
      <div>
        ${message || '<em>No message. Decryption may have failed.</em>'}
      </div>
      <br/>
      <a href="/">Go home.</a>
    </body>
  </html>
  `);
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

server.listen(3000, () => console.log('Server is listening at port 3000. Open yer browser!'));
