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

