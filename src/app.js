require('dotenv').config(); // used to read in GITHUB_TOKEN and SECRET_KEY environment variables
const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'neuroleptic';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

const secretKey = process.env.SECRET_KEY; // Base64-encoded Uint8Array

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.send(`
    <html>
      <head>
      </head>
      <body>
        <h1>Secret Gist API</h1>
        <p>GET /gists - Retrieves a list of all gists for the currently authed user</p>
        <p>GET /key - Return the secret key used for encryption of secret gists</p>
        <p>GET /secretgist/:id - Retrieves and decrypts the secret gist corresponding to the given ID</p>
        <p>POST /create - Creates a private gist with the name and content given in post request</p>
        <p>POST /createsecret - Creates a private and encrypted gist with the name and content given in post request</p>
      </body>
    </html>
  `);
});

server.get('/gists', async (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  try {
    const result = await github.gists.getForUser({ username });
    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.json(secretKey);
});

server.get('/secretgist/:id', async (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  try {
    const { id } = req.params;
    const result = await github.gists.get({ id });
    const data = Object.values(result.data.files)[0].content;
    const encodedNonce = data.slice(0, 32);  // Base64-encoded nonce has a length of 32
    const encodedAndEncryptedContent = data.slice(32);
    const nonce = nacl.util.decodeBase64(encodedNonce);
    const encryptedContent = nacl.util.decodeBase64(encodedAndEncryptedContent);
    const decryptedContent = nacl.secretbox.open(encryptedContent, nonce, nacl.util.decodeBase64(secretKey));
    const content = nacl.util.encodeUTF8(decryptedContent);
    res.json(content);
  } catch (error) {
    res.json(error);
  }
});

server.post('/create', async (req, res) => {
  // TODO Create a private gist with name and content given in post request
  try {
    const { name, content } = req.body;
    const result = await github.gists.create({
      files: {
        [name]: {
          content
        }
      },
      public: false
    });
    res.json(result);
  } catch (error) {
    res.json(error);
  }
});

server.post('/createsecret', async (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  try {
    const { name, content } = req.body;
    const nonce = nacl.randomBytes(24);  // nonce length is 24 according to documentation
    const encryptedContent = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, nacl.util.decodeBase64(secretKey));
    const encodedContent = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(encryptedContent);
    const result = await github.gists.create({
      files: {
        [name]: {
          content: encodedContent
        }
      },
      public: false
    });
    res.json(result);
  } catch (error) {
    res.json(error);
  }
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

server.listen(3000);
