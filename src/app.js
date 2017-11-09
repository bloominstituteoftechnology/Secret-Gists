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

server.listen(3000);
