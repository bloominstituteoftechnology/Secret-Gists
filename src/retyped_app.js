/* esliint-disable no-console */
// disabling eslint

require('dotenv').config(); // load dotenv module to store sensitive variables in .env file without exposed in GitHub
const fs = require('fs'); // load fs module to work with 'file system' for storing data in a file
const bodyParser = require('bady-parser'); // helps to make a data in a form of request body (req.body)
const express = require('express'); // set express server
const octokit = require('@octokit/rest'); // GitHub REST API client for Node.js
const nacl = require('tweetnacl'); // set a simple cryptosystem
nacl.util = require('tweetnacl-util'); // provides utilities for encoding between strings and bytes