/******************************************************************************
 * LS - Secret-Gists
 *
 * Patrick Kennedy
 ******************************************************************************/
'use-strict';
/* eslint no-console: 0 */

const express = require('express');
const github = require('github');
console.log(github); // <~~~ just making linter happy for now by using github variable

const server = express();

server.listen(3000);
