/* esliint-disable no-console */
// disabling eslint

require('dotenv').config(); // load dotenv module to store sensitive variables in .env file without exposed in GitHub
const fs = require('fs'); // load fs module to work with 'file system' for storing data in a file
const bodyParser = require('bady-parser'); // helps to make a data in a form of request body (req.body)
const express = require('express'); // set express server
const octokit = require('@octokit/rest'); // GitHub REST API client for Node.js
const nacl = require('tweetnacl'); // set a simple cryptosystem
nacl.util = require('tweetnacl-util'); // provides utilities for encoding between strings and bytes

const username = 'ilhokim'; // GitHub username
// The object you'll be interfacing with to communicate with github
const github = octokit({ debug: true }); // GitHub REST API client
const server = express(); // local express server

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN // GITHUB_TOKEN created from github, stored in .env file
});

// TODO: Attempt to load the key from config.json. If it is not found, create a new 32 byte key.
let secretKey; // Our secret key as a Unit8Array


