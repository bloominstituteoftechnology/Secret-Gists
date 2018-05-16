require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'natdf'; // Replace with your username
const github = octokit({ debug: true });
const server = express();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN,
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
const key = process.env.SECRET_KEY
  ? nacl.util.decodeBase64(process.env.SECRET_KEY)
  : nacl.randomBytes(32);

// The below represents my untested understanding the situation to replace the block above
// process.env.SECRET_KEY = process.env.SECRET_KEY
//   ? process.env.SECRET_KEY
//   : nacl.util.encodeBase64(nacl.randomBytes(32));

// const key = nacl.util.decodeBase64(process.env.SECRET_KEY);

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  res.send(`
    <html>
      <header><title>Secret Gists!</title></header>
      <body>
        <h1>Secret Gists!</h1>
        <h2>Supported operations:</h2>
        <ul>
          <li><i><a href="/gists">GET /gists</a></i>: retrieve a list of gists for the authorized user (including private gists)</li>
          <li><i><a href="/key">GET /key</a></i>: return the secret key used for encryption of secret gists</li>
          <li><i>GET /secretgist/ID</i>: retrieve and decrypt a given secret gist
          <li><i>POST /create { name, content }</i>: create a private gist for the authorized user with given name/content</li>
          <li><i>POST /createsecret { name, content }</i>: create a private and encrypted gist for the authorized user with given name/content</li>
          <li><i><a href="/keyPairGen">Generate Keypair</a></i>: Generate a keypair.  Share your public key for other users of this app to leave encrypted gists that only you can decode with your secret key.</li>
        </ul>
        <h3>Create an *unencrypted* gist</h3>
        <form action="/create" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist</h3>
        <form action="/createsecret" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for a friend to decode</h3>
        <form action="/postmessageforfriend" method="post">
          Name: <input type="text" name="name"><br>
          Friend's Public Key: <input type="text" name="publicKey"><br>
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

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  github.gists
    .getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', (req, res) => {
  // Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;

  github.gists
    .get({ id })
    .then((response) => {
      const filename = Object.keys(response.data.files)[0];
      const gist = response.data.files[filename];

      const blob = gist.content;
      const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
      const secretBox = nacl.util.decodeBase64(blob.slice(32));
      const content = nacl.secretbox.open(secretBox, nonce, key);
      const plainText = nacl.util.encodeUTF8(content);
      res.send(plainText);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/keyPairGen', (req, res) => {
  // Generate a keypair to use for sharing secret messages using public gists
  let keypair;
  const secretKey = process.env.SECRET_KEY;

  if (secretKey) {
    keypair = nacl.box.keyPair.fromSecretKey(nacl.util.decodeBase64(secretKey));
    // process.env.PUBLIC_KEY = nacl.util.encodeBase64(keypair.publicKey);
  } else {
    keypair = nacl.box.keyPair();
    process.env.SECRET_KEY = nacl.util.encodeBase64(keypair.publicKey);
    // process.env.SECRET_KEY = nacl.util.encodeBase64(keypair.secretKey);
    // process.env.PUBLIC_KEY = nacl.util.encodeBase64(keypair.publicKey);
  }
  // the three comments above represent my untested understanding of the situation

  // Display the keys as strings
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

server.post('/create', urlencodedParser, (req, res) => {
  // Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists
    .create({ files, public: false })
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

  const nonce = nacl.randomBytes(24);
  const encryptedContent = nacl.util.decodeUTF8(content);
  const secretBox = nacl.secretbox(encryptedContent, nonce, key);

  // To save, we need to keep both encrypted content and nonce
  const blob =
    nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(secretBox);

  const files = { [name]: { content: blob } };
  github.gists
    .create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
  // Create a private and encrypted gist with given name/content
  // using someone else's public key that can be accessed and
  // viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename

  if (!key) {
    // Must create saved key first
    res.send(`
    <html>
      <header><title>No Keypair</title></header>
      <body>
        <h1>Error</h1>
        <div>You must create a keypair before using this feature.</div>
      </body>
    `);
  } else {
    // If the key exists, create an asymetrically encrypted message
    // Using their public key
    const { name, content, publicKey } = req.body;

    const nonce = nacl.util.encodeBase64(nacl.randomBytes(24));
    const box = nacl.box(
      nacl.util.decodeUTF8(content),
      nacl.util.decodeBase64(nonce),
      nacl.util.decodeBase64(publicKey),
      key
    );
    const box64 = nacl.util.encodeBase64(box);

    // Build string that is the messager's public key + encrypted message blob
    // to share with the friend.
    const messageString = process.env.PUBLIC_KEY + nonce + box64;
    const files = { [name]: { content: messageString } };

    github.gists
      .create({ files, public: true })
      .then((response) => {
        // Display the string built above
        res.send(`
        <html>
          <header><title>Message Saved</title></header>
          <body>
            <h1>Message Saved</h1>
            <div>Give this string to your friend for decoding.</div>
            <div>${response.data.id}</div>
            <div>
          </body>
        `);
      })
      .catch((err) => {
        res.json(err);
      });
  }
});

server.get(
  '/fetchmessagefromfriend:messageString',
  urlencodedParser,
  (req, res) => {
    // Retrieve, decrypt, and display the secret gist corresponding to the given ID
    const id = req.query.messageString;

    github.gists
      .get({ id })
      .then((response) => {
        const filename = Object.keys(response.data.files)[0];
        const gist = response.data.files[filename];

        const blob = gist.content;
        const publicKey = nacl.util.decodeBase64(blob.slice(0, 44));
        const nonce = nacl.util.decodeBase64(blob.slice(44, 44 + 32));
        const box = nacl.util.decodeBase64(blob.slice(44 + 32));
        const content = nacl.box.open(box, nonce, publicKey, key);
        const plainText = nacl.util.encodeUTF8(content);
        res.send(plainText);
      })
      .catch((err) => {
        res.json(err);
      });
  }
);

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
  process.stdout.write('Listening on port 3000\n');
});
