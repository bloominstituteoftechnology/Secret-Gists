require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'myxozoa';
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
// TODO:  Use the existing key or generate a new 32 byte key
const secret_key = process.env.SECRET;

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
        .then(response => {
            res.json(response.data);
        })
        .catch(err => {
            res.json(err);
        });
});

server.get('/key', (req, res) => {
    // TODO Return the secret key used for encryption of secret gists
    res.send(`
  <html>
    <header><title>Key</title></header>
    <body>
      <h1>Key</h1>
      <div>This is the secret key used for encryption of secret gists.</div>
      <br/>
      <div>Secret Key: ${secret_key}</div>
    </body>
  </html>
  `);
});

server.get('/secretgist/:id', (req, res) => {
    github.gists.get({ id: req.params.id }).then(response => {
        const gist = response.data;
        const filename = Object.keys(gist.files)[0];
        const blob = gist.files[filename].content;

        const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
        const ciphertext = nacl.util.decodeBase64(blob.slice(32));
        const plaintext = nacl.secretbox.open(ciphertext, nonce, nacl.util.decodeBase64(secret_key));
        res.send(`
    <html>
      <head><title>Secret Gist</title></head>
      <body>
        <h2>${filename}</h2>
        <div>${nacl.util.encodeUTF8(plaintext)}</div>
      </body>
    </html>
  `);
    });
});

server.get('/keyPairGen', (req, res) => {
    const keypair = nacl.box.keyPair();
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
        .then(response => {
            res.json(response.data);
        })
        .catch(err => {
            res.json(err);
        });
});

server.post('/createsecret', urlencodedParser, (req, res) => {
    const { name, content } = req.body;
    const nonce = nacl.randomBytes(24);
    const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, nacl.util.decodeBase64(secret_key));

    const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
    const files = { [name]: { content } };
    github.gists
        .create({ files, public: false })
        .then(response => {
            res.json(response.data);
        })
        .catch(err => {
            res.json(err);
        });
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
    if (secret_key === undefined) {
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
        // Using their public key
        const { name, content, publicKey } = req.body;
        const nonce = nacl.randomBytes(24);
        const ciphertext = nacl.box(nacl.util.decodeUTF8(content), nonce, nacl.util.decodeBase64(publicKey), nacl.util.decodeBase64(secret_key));

        const files = { [name]: { content } };

        github.gists
            .create({ files, public: true })
            .then(response => {
                // TODO Build string that is the messager's public key + encrypted message blob
                // to share with the friend.
                const nonce64 = nacl.util.encodeBase64(nonce);
                const messageString = process.env.PUB + nonce64 + nacl.util.encodeBase64(ciphertext);
                // const pub = process.env.PUB;
                // Display the string built above
                res.send(`
              <html>
                <header><title>Message Saved</title></header>
                <body>
                  <h1>Message Saved</h1>
                  <div>Give this string to your friend for decoding.</div>
                  <br/>
                  <div>${messageString}</div>
                  <div>
                </body>
              `);
            })
            .catch(err => {
                console.log(err);
                res.json(err);
            });
    }
});

server.get('/fetchmessagefromfriend/:messageString', urlencodedParser, (req, res) => {
    const string = req.params.messageString;
    const pub_key = nacl.util.decodeBase64(string.slice(0, pub.length));
    const non = nacl.util.decodeBase64(string.slice(pub.length, nonce64.length + pub.length));
    const cipher = nacl.util.decodeBase64(string.slice(pub.length + nonce64.length));
    const plain = nacl.box.open(cipher, non, pub_key, nacl.util.decodeBase64(process.env.SECRET));

    res.send(`
    <html>
      <header><title>Message Saved</title></header>
      <body>
        <h1>Message Saved</h1>
        <div>Give this string to your friend for decoding.</div>
        <br/>
        <div>${nacl.util.encodeUTF8(plain)}</div>
        <div>
      </body>
    `);});

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

server.listen(3000);
