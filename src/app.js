require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const Octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'jamiemd';  // TODO: your GitHub username here
const github = new Octokit({ debug: true });
const server = express();

// takes items from form and put them into parameters into http request in a way that express can get at them
const urlencodedParser = bodyParser.urlencoded({ extended: false });


// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
const key = process.env.SECRET_KEY ?
  nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);
// assume it's a string and decode from base 64 a list of numbers, otherwise generate a new 32 byte key

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  res.send('/gists, /key, /secretgist/:id, /create, /createsecret, /createsecret, /login');
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});
// console.log('/gist alled"');
// const result = async () => {
//   await Octokit.authorization.getAll({});
// };
// res.send('result', result);
// console.log(result);

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.send(nacl.util.encodeBase64(key)); // encode the key from a number and into base 64 string, then return it to the user
  // let's us use copy of key and set it is an environment variable so it persists so we can use it next time
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;
  github.gists.get({ id }).then((response) => {
    const gist = response.data;
    const filename = Object.key(gist.files)[0]; // get the 0th key for the files, key is name of file to use to retrieve content
    const blob = gist.files[filename].content; // get filename and content of the filename, blob is the same blob as the one in /createsecret route
    // blob corresponds assuming we gave id of secret gist that we made with /createsecret route
    const nonce = nacl.util.decodeBase64(blob.slice(0, 32)); // slice off nonce, first 32 characters of 64 base encoded thing gives us 24 bytes of data, assume 24 bytes correspond to nonce
    // slice off characters, base 64 blob and decode into nonce
    const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length)); // from 32 to the end slice, still base 64, would be ciphertext
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key); // use nacl to open secretbox it created, give it ciphertext, nonce, and key, gets back plaintext which is numbers
    res.send(nacl.util.encodeUTF8(plaintext)); // chance plaintext numbers into unicode UTF8 (human meaningful things) not base64 (base64 for non-human meaningful things)
  });
});

server.post('/create', urlencodedParser, (req, res) => { // pass in urlencodedParser
  // TODO Create a private gist with name and content given in post request
  const { name, content } = req.body; // parser let's us take out stuff from req.body of form (name and content of gist)
  const files = { [name]: { content } }; // bracketed name(title) makes key and content(body) is value
  github.gists.create({ files, public: false }) // make gist from files, make it private
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
  // const result = async () => {
  //   await Octokit.authorization.create({ files, private });
  // };
});

server.post('/createsecret', urlencodedParser, (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { name, content } = req.body;
  const nonce = nacl.randomBytes(24); // nonce (24 random bytes) adds uniqueness to each ciphertext, makes it harder to brute force
  const ciphertext = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);
  // content -assume it's a utf8 string, decoding it to a bunch of numbers, then use nonce and key which are more random numbers
  // then nacl uses key and nonce to scramble the content and give us a ciphertext, also a bunch of numbers, which is secure and audited
  const blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext); // nonce encoded to base64 and concatenate that with the ciphertext, so now it's a long string
  const files = { [name]: { content: blob } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    }).catch((err) => {
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

server.listen(3000, () => console.log('Listening on port 3000!'));
