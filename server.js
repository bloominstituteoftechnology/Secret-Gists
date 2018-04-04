require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const routes = require('./src/routes/routes');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const server = express();
server.use(bodyParser.json());

const github = octokit({ debug: true });
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

routes(server);

server.listen(3000);

