const express = require('express');
const github = require('github');

const server = express();

server.post('/login', (req, res) => {
    const { username, oauth_token } = req.body;
    // TODO log in to GitHub, return success/failure response
});

server.get('/gists', (req, res) => {
    // TODO retrieve a list of gists for the currently authed user
});

server.listen(3000);
