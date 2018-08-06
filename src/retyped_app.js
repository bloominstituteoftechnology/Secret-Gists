require('dotenv').config(); // Reminder to create a .env file to add variables to.
const fs = require('fs'); // File system node.js module that allows us to interact with the file system
const bodyParser = require('body-parser'); // module to extract the body portion of an incoming request stream and expose it on req.body
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = process.env.USERNAME;
const github = octokit({ debug: true }); // The object you'll be interfacing with to communicate with github
const server = express();

const urlencodedParser = bodyParser.urlencoded({ extended: false }); // Create application/x-www-form-urlencoded parser

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
}); // Generate an access token: http://github.com/settings/tokens; Set it to be able to create gists

let secretKey;
try {
  const data = fs.readFileSync('./config.json');
  const keyObject = JSON.parse(data);
  secretKey = nacl.util.decodeBase64(keyObject.secretKey);
} catch (err) {
  secretKey = nacl.randomBytes(32);
  const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };
  fs.writeFile('./config.json', JSON.stringify(keyObject), (ferr) => {
    if (ferr) {
      process.stdout.write(
        'Error writing secret key to config file: ',
        ferr.message
      );
      return;
    }
  });
}
