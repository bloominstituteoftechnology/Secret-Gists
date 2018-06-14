require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'sophiemullerc';  // TODO: your GitHub username here
const github = new octokit({ debug: true });
const server = express();

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
  const data = fs.readFileSync('./config.json');
  let secretKey;

    try {
      const keyObject = JSON.parse(data);
      secretKey = nacl.util.decodeBase64(keyObject.secretKey);
    
    } catch (err) {
      secretKey = nacl.randomBytes(32);
  
      const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };
          fs.writeFile('./config.json', JSON.stringify(keyObject), (ferr) => {
         if (ferr) {
             console.log('There has been an error saving the key data.');
            console.log(err.message);
           return;
          }
      });
    }

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  github.gists
     .getForUser({ username })
     .then((response) => {
       res.json(response.data);
     })
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  res.send(nacl.util.encodeBase64(secretKey));
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
   const keyString = req.query.keyString;
     try {
         secretKey = nacl.util.decodeBase64(keyString);
          res.send(`<div> Key set to new value: ${keyString} </div>`);
   
      } catch (err) {
     
     res.send('Failed to set key.  Key string appears invalid.');
      }
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
   const { name, content } = req.body;
   const files = { [name]: { content } };
    github.gists.create({ files, public: false })
    github.gists
      .create({ files, public: false })
      .then((response) => {
       res.json(response.data);
     })
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
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
