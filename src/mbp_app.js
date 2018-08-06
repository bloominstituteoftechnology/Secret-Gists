/* eslint-disable no-console */
console.log("test")

require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
// nacl or salt is what we use to encrypt data
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = process.env.GITHUB_USERNAME;
const github = octokit({ debug: true });
const server = express();

const urlencoderParser = bodyParser.urlencoded({ extended: false })

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

let secretKey;

try {
  // try to read the config file
  const data = fs.readFileSync('./config.json');
  //parse the data that we read from the json file
  const keyObject = JSON.parse(data);
  secretKey = nacl.util.decodeBase64(keyObject.secretKey);
} catch (err) {
  //if secretKey doesn't exist, it can't be read. This will start the catch block where we create a secret Key
  secretKey = nacl.randomBytes(32);
  //Create the keyObject, encoding the secretKey as a string
  const keyObject = { secretKey: nacl.util.encodedBase64(secretKey) };
  //Write this keyObject to config.json
  fs.writeFile('/config.json', JSON.stringify(keyObject), (err) => {
    if (err) {
      console.log('Error writing secret key to config this ', err.message);
      return;
    }
  });
}


