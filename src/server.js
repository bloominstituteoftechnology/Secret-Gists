require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const routes = require('./routes/routes');
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

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available 
  res.send(`
  <html>
    <header><title>Secret Gists!</title></header>
    <body>
      <h1>Secret Gists!</h1>
      <h2>Supported operations:</h2>
      <ul>
        <li><i><a href="/gists">GET /gists</a></i>: retrieve a list of gists for the authorized user (including private gists)</li>
        <li><i><a href="/key">GET /key</a></i>: return the secret key used for encryption of secret gists</li>
        <li><i>GET /secretgist/ID</i>: retrieve and decrypt a given secret gist
        <li><i>POST /create { name, content }</i>: create a private gist for the authorized user with given name/content</li>
        <li><i>POST /createsecret { name, content }</i>: create a private and encrypted gist for the authorized user with given name/content</li>
      </ul>
      <h3>Create an *unencrypted* gist</h3>
      <form action="/create" method="post">
        Name: <input type="text" name="name"><br>
        Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
        <input type="submit" value="Submit">
      </form>
      <h3>Create an *encrypted* gist</h3>
      <form action="/createsecret" method="post">
        Name: <input type="text" name="name"><br>
        Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
        <input type="submit" value="Submit">
      </form>
    </body>
  </html>
`);
});
  // TODO Retrieve a list of all gists for the currently authed user


server.listen(3000);

