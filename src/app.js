const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'phytertek'; // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();

server.use(bodyParser.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SECRET_KEY = process.env.SECRET_KEY
  ? nacl.util.decodeBase64(process.env.SECRET_KEY)
  : nacl.randomBytes(32);

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.json({
    'GET /': 'Returns available routes/operations',
    'GET /gists': 'Retrieve a list of all gists for the currently authed user',
    'GET /key': 'Return the secret key used for encryption of secret gists',
    'GET /secretgist/:id':
      'Retrieve and decrypt the secret gist corresponding to the given ID',
    'POST /create':
      'Create a private gist with name and content given in post request',
    'POST /createsecret':
      'Create a private and encrypted gist with given name/content',
    'POST /login': 'log in to GitHub, return success/failure response'
  });
});

server.get('/gists', async (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  try {
    const gists = await github.gists.getAll({});
    res.json(gists);
  } catch (error) {
    res.status(422).json(error);
  }
});

server.get('/key', async (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  try {
    res.json({ key: nacl.util.encodeBase64(SECRET_KEY) });
  } catch (error) {
    res.status(422).json(error);
  }
});

server.get('/secretgist/:id', async (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  try {
    const { id } = req.params;
    const gist = await github.gists.get({ id });
    const file = Object.keys(gist.data.files)[0];
    const data = gist.data.files[file].content;
    const nonce = data.slice(0, 32);
    const encryptedContent = data.slice(32);
    const decodedNonce = nacl.util.decodeBase64(nonce);
    const decodedEncryptedContent = nacl.util.decodeBase64(encryptedContent);
    const decryptedContent = nacl.secretbox.open(
      decodedEncryptedContent,
      decodedNonce,
      SECRET_KEY
    );
    const readableContent = nacl.util.encodeUTF8(decryptedContent);
    res.json({ content: readableContent });
  } catch (error) {
    res.status(422).json(error);
  }
});

server.post('/create', async (req, res) => {
  // TODO Create a private gist with name and content given in post request
  try {
    const { name, content } = req.body;
    const gist = await github.gists.create({
      files: { [name]: { content } },
      public: false
    });
    res.json({ id: gist.data.id });
  } catch (error) {
    res.status(422).json(error);
  }
});

server.post('/createsecret', async (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  try {
    const { name, content } = req.body;
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encryptedContent = nacl.secretbox(
      nacl.util.decodeUTF8(content),
      nonce,
      SECRET_KEY
    );
    const nonce64 = nacl.util.encodeBase64(nonce);
    const encrypted64 = nacl.util.encodeBase64(encryptedContent);
    const fileContents = `${nonce64}${encrypted64}`;
    const gist = await github.gists.create({
      files: { [name]: { content: fileContents } },
      public: false
    });
    res.json({ id: gist.data.id });
  } catch (error) {
    res.status(422).send(error);
  }
});

/* OPTIONAL - if you want to extend functionality */
// server.post('/login', async (req, res) => {
// TODO log in to GitHub, return success/failure response
// This will replace hardcoded username from above
//   try {
//   } catch (error) {
//     res.status(422).json(error);
//   }
// });

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
