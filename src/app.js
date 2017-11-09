/******************************************************************************
 * LS - Secret-Gists
 * let users authenticate with GitHub (rather than maintaining your own user data)
 * and save/retrieve gists
 * Patrick Kennedy
 ******************************************************************************/
'use-strict';
/* eslint no-console: 0 */

const express = require('express');
const github = require('github');
console.log(github); // <~~~ just making linter happy for now by using github variable

const server = express();

server.post('/login', (req, res) => {
  const { username, oauth_token } = req.body;
  // TODO log in to GitHub, return success/failure response
});

server.get('/gists', (req, res) => {
  // TODO retrieve a list of gists for the currently authed user
});

server.listen(3000);
