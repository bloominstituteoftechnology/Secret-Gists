require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
// Just use ENV // const username = 'your_name_here'; // TODO: Replace with your username
const github = octokit({ debug: true });
const server = express();
// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });
github.authenticate({ type: 'oauth', token: process.env.GITHUB_TOKEN });
// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key. // Return a response that documents the other routes/operations available
server.get('/', (req, res) => { res.send(/**/); });
// TODO:  Generate a keypair from the secretKey and display both // Display both keys as strings
server.get('/keyPairGen', (req, res) => { res.send(/**/); });
// Retrieve a list of all gists for the currently authed user
server.get('/gists', (req, res) => {
  github.gists.getForUser({ username })
    .then((response) => { res.json(response.data); })
    .catch((err) => { res.json(err); });
});
// TODO: Display the secret key used for encryption of secret gists
server.get('/key', (req, res) => {});
// TODO: Set the key to one specified by the user or display an error if invalid
server.get('/setkey:keyString', (req, res) => {
  const keyString = req.query.keyString;
  try {};
  catch (err) { res.send('Failed to set key.  Key string appears invalid.'); } // failed 
});
// TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
server.get('/fetchmessagefromself:id', (req, res) => {});
// Create a private gist with name and content given in post request
server.post('/create', urlencodedParser, (req, res) => {
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists.create({ files, public: false })
    .then((response) => { res.json(response.data); })
    .catch((err) => { res.json(err); });
});
// TODO:  Create a private and encrypted gist with given name/content // NOTE - we're only encrypting the content, not the filename 
server.post('/createsecret', urlencodedParser, (req, res) => {});
// TODO:  Create a private and encrypted gist with given name/content // using someone else's public key that can be accessed and // viewed only by the person with the matching private key // NOTE - we're only encrypting the content, not the filename
server.post('/postmessageforfriend', urlencodedParser, (req, res) => {});
// TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
server.get('/fetchmessagefromfriend:messageString', urlencodedParser, (req, res) => {});
/* OPTIONAL - if you want to extend functionality */ // TODO log in to GitHub, return success/failure response // This will replace hardcoded username from above // const { username, oauth_token } = req.body;
server.post('/login', (req, res) => { res.json({ success: false }); });
/*Still want to write code? Some possibilities: -Pretty templates! More forms! -Better management of gist IDs, use/display other gist fields -Support editing/deleting existing gists -Switch from symmetric to asymmetric crypto -Exchange keys, encrypt messages for each other, share them -Let the user pass in their private key via POST*/
server.listen(3000);
