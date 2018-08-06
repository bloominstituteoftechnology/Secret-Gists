// imports to use middleware and libraries
require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

// code
const username = 'Blast3d'; // Added my username so the program can access my gists account.