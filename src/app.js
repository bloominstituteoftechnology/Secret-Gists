const bodyParser = require('body-parser'); 
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

// import GITHUB_TOKEN  from '/.env';
// console.log(GITHUB_TOKEN);  

const username = 'lorinfields';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();

const urlencoderParser = bodyParser.urlencoded({ extended: false});

// Encrypting flow:
// -Generate (with `nacl.randomBytes`) or read from memory (`process.env.SECRET_KEY` and `util.decodeBase64`) the secret key
// -Generate a unique nonce (`nacl.randomBytes`) for the message
// -`util.decodeUTF8` to convert the plaintext gist to numbers
// -Do the crypto `secretbox`
// -`util.encodeBase64` to convert the crypto numbers (both from secretbox and the nonce) to ciphertext

// Decrypting flow:
// -Again make sure you have secret key
// -`util.decodeBase64` the ciphertext, get the nonce from the the front of it
// -Open the box (again look at secretbox documentation)
// -`util.encodeUTF8` to make the decrypted numbers into nice human text again (edited)

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
const key = process.env.SECRET_KEY ? 
      nacle.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32); 

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.send(
    <html>
      <header><title>Secret Gists</title></header>
      <body>
        <h1>Secret Gists</h1>
        <h2>Supported Operations:</h2>
        <ul>
          <li><i><a href="/gists">GET /gists</a></i>: retriev a list of gists for the authorized user  </li>
          <li><i><a href="/key">GET /key</a></i>: return the secret key used for the encryption of secret gists </li>
          <li><i>GET /secretgist/ID</i>: retrieve and decrypt a given secret gist
          <li><i>POST /create { name, content }</i>: create a private gist for the authorized user with given name</i></li>
          <li><i>POST /createsecret { name, content }</i>: create a private and ecrpyted gist for the authorized user with given name</i></li>
        </ul>
        <h3>Create an *undencrypted* gist</h3>
        <form action="/create" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
      
  );
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({ username })
    .then((response) => {
      res.json(resonse.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;
  github.gists.get({ id }).then((response) => {
    const gist = response.data;
    const filename = Object.keys(gist.files) [0];
    const blob = gist.files[filename].content;

    const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
    const ciphertext = nacle.util.decodeBase64(blob.slice(32, blob.length));
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
    res.send(nacl.util.encodeUTF8(plaintext));
  });
});

server.post('/create', urlencoderParser, (req, res) => {
  // TODO Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: {content}};
  github.gists.create({ files, public: false })
    .then((resopnse) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/createsecret', urlencoderParser, (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { name, content } = req.body;
  const nonce = nacle.randomBytes(24);
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  const blob = nacl.util.encodeBase64(nonce) + 
        nacl.util.encodeBase64(ciphertext);
  const files = { [name]: { content: blob } };
  github.gists.create({ files, public: false })
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

server.listen(3000);
