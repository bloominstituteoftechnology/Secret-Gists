/* ****************************************************************************
 * LS - Secret-Gists
 * let users authenticate with GitHub (rather than maintaining your own user data)
 * and save/retrieve gists
 * Patrick Kennedy
 **************************************************************************** */

'use-strict';

/* eslint no-console: 0 */

const express = require('express');
const Github = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

// console.log(Github);

// console.log('1.) nacl\n', nacl, '\n', '2.) nacl.util\n', nacl.util);

const server = express();

const githubCli = new Github({
  baseUri: 'https://api.github.com',
  token: process.env.GITHUB_TOKEN
});

// console.log('1.) process.env\n', process.env, '\n');
// console.log('2.) process.env.GITHUB_TOKEN\n', process.env.GITHUB_TOKEN, '\n');
// console.log('githubCli \n', githubCli);

// let handle = 'k33g';
const handle = 'mixelpixel';
githubCli.users.getForUser({ username: handle }).then((response) => {
  console.log('\n1.) getForUser response.data:\n', response.data);
});

githubCli.gists.getAll({}).then((response) => {
  console.log('2.) getAll response data:\n', response);
});

server.post('/login', (req, res) => {
  const { username, oauth_token } = req.body;
  console.log(username, oauth_token);
  // TODO log in to GitHub, return success/failure response
  // githubCli.gists.getALL
  // githubCli.gists.getForUser
  // nacl.util methods for encryption encodebase64
  // secretbox & secretboxOpen
});

server.get('/gists', (req, res) => {
  // TODO retrieve a list of gists for the currently authed user

});

server.listen(3000);
