/* eslint-disable no-console */

require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const key = nacl.randomBytes(32);
const message = 'antidiluvian';
const uint8Message = nacl.util.decodeUTF8(message);
const nonce = nacl.randomBytes(24);

const cryptoContent = nacl.secretbox(uint8Message, nonce, key);
// console.log(uint8Message);
// console.log(cryptoContent);

const decryptedContent = nacl.secretbox.open(cryptoContent, nonce, key);
const plainTextDecrypted = nacl.util.encodeUTF8(decryptedContent);
// console.log(decryptedContent);
console.log(plainTextDecrypted);

