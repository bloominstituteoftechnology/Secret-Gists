require('dotenv').config();// pulling in the info from the env file 
const fs = require('fs');
const bodyParser = require( 'body-parser' );
const express = require( 'express' );
const octokit = require( '@octokit/rest' );//family of client libraries for the GitHub API
const nacl = require( 'tweetnacl' );//pulls in high-security cryptographic library.
nacl.util = require( 'tweetnacl-util' );//pulls in high-security cryptographic library.
