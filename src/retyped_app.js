require('dotenv').config(); // pulling in the info from the env file
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest'); //family of client libraries for the GitHub API
const nacl = require('tweetnacl'); //pulls in high-security cryptographic library.
nacl.util = require('tweetnacl-util'); //pulls in high-security cryptographic library.

const username = 'April7229';  //putting in my username. 
const github = octokit({
  debug: true
} );      //oks like it is pulling the octokit library and setting it debug to true
const server = express(); // Express, is a web application framework for Node.js

// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded( { extended: false } );//A new body object containing the parsed data is populated on the request object after the middleware (i.e. req.body). This object will contain key-value pairs, where the value can be a string or array (when extended is false), or any type (when extended is true).
//generate an access token: https://github.com/settings/tokens
// set it to be able to create gists
github.authenticate( {
    type: 'oauth',
    token: process.env.GITHUB_TOKEN
} );// GET THE GITHUB TOKEN OAuth (Open Authorization) is an open standard for token-based authentication and authorization on the Internet
// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.
// 1. Try to read the config.json file
// 2. If the config.json exists and the key is in there, initialize `secretKey` variable to be the value in the file
// 3. If we fail to read the config.json, generate a new random secretKey

const key = process.env.SECRET_KEY // OUR SECRET KEY AS A Uint8array
    ? nacl.util.decodeBased64( process.env.SECRET_KEY )
    : nacl.randomBytes( 32 );
