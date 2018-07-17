require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const github = octokit({ debug: true });
const server = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false }); // Create application/x-www-form-urlencoded parser
const username = process.env.GITHUB_USERNAME;
github.authenticate({ type: 'oauth', token: process.env.GITHUB_TOKEN });
const keypair = {}
server.get('/', (req, res) => { res.send(require('./index_1.js')()); });
server.get('/keyPairGen', (req, res) => { res.send(require('./index_2.js')(nacl, keypair)); });
server.get('/gists', (req, res) => { github.gists.getForUser({ username }).then((response) => { res.json(response.data); }).catch((err) => { res.json(err); }); });
server.get('/fetchmessagefromself:id', (req, res) => { let { id } = req.query.data; github.gists.get({id}).then((res) => { let gist = responce.data; let filename = Object.keys(gist.files); }).catch((err) => res.json(err.message)); }); // TODO: handle .then logic
server.post('/create', urlencodedParser, (req, res) => { let { name, content } = req.body; let files = { [name]: { content } }; github.gists.create({ files, public: false }).then((response) => { res.json(response.data); }).catch((err) => { res.json(err); }); }); // Create a private gist with name and content given in post request
server.post('/createsecret', urlencodedParser, (req, res) => { // Publicly posted code today // TODO:  Create a private and encrypted gist with given name/content // NOTE - we're only encrypting the content, not the filename 
	let { name, content } = req.body;
	let nonce = nacl.randomBytes(24);
	let cipher = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, privateKey);
	let blob = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(cipher);
	let files = { [name]: {content : blob}};
	github.gists.create({files, public: false})
    .then((response) => { res.json(response.data); })
    .catch((err) => { res.json(err); })
});
server.post('/postmessageforfriend', urlencodedParser, (req, res) => {}); // TODO:  Create a private and encrypted gist with given name/content // using someone else's public key that can be accessed and // viewed only by the person with the matching private key // NOTE - we're only encrypting the content, not the filename
server.get('/fetchmessagefromfriend:messageString', urlencodedParser, (req, res) => {}); // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
server.post('/login', (req, res) => { res.json({ success: false }); }); /* OPTIONAL - if you want to extend functionality */ // TODO log in to GitHub, return success/failure response // This will replace hardcoded username from above // const { username, oauth_token } = req.body;
server.get('/key', (req, res) => {}); // TODO: Display the secret key used for encryption of secret gists // TODO: Set the key to one specified by the user or display an error if invalid //server.get('/setkey:keyString', (req, res) => { //const keyString = req.query.keyString; // try {}; // catch (err) { res.send('Failed to set key.  Key string appears invalid.'); } // failed  //}); // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
server.listen(3000);
