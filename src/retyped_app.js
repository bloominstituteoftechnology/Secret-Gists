// disable eslint's dislike for console.logs
/* eslist-disable no-console */

// configure a .env
require('dotenv').config();

// Dependency Variable Index
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

// for privacy, username is stored in .env
const username = process.env.USER_NAME;
// create a github variable to interface with to communicate with Github
const github = octokit({ debug: true });
// create a server variable to use express() with
const server = express();
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// initalize Secret and Public Key variables
let secretKey;
let publicKey;

// Generate an access token on Github.com and put it
// in .env and use that to authenticate a session
github.authenticate({
  type: 'oauth',
  token: process.env.GUTHUB.TOKEN
});
