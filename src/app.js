/* eslint-disable eol-last */
/* eslint-disable no-console */
/* eslint-disable no-else-return */
/* eslint-disable quotes */

require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'ckopecky'; // TODO: Replace with your username
const github = octokit({ debug: true });
const server = express();
const secretKey = process.env.MY_SECRET || process.env.secretkey;
// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.

const secretKeyGetter = () => {
  if (process.env.MY_SECRET) {
    const MY_SECRET = nacl.util.encodeBase64(process.env.MY_SECRET);
    return MY_SECRET;
  } else {
    const secretkey = nacl.randomBytes(32);
    fs.open('./.env', 'a', (err, fd) => {
      if (err) {
        console.log({ err });
      } else {
        console.log(".env file opened successfully!");
      }
      fs.write(fd, `\nsecretkey=${nacl.util.encodeBase64(secretkey)}\n`, (error, written = 32, str) => {
        if (error) {
          console.log({ error });
        } else {
          console.log("file written to successfully!");
        }
        fs.close(fd, (errors) => {
          if (errors) {
            console.log({ errors });
          } else {
            console.log("File closed successfully!");
          }
        });
      });
      const Secretkey = nacl.util.encodeBase64(secretkey);
      return Secretkey;
    });
  }
};

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  res.send(`
    <html>
      <header><title>Secret Gists!</title></header>
      <body>
        <h1>Secret Gists!</h1>
        <div>This is an educational implementation.  Do not use for truly valuable information</div>
        <h2>Supported operations:</h2>
        <ul>
          <li><i><a href="/keyPairGen">Show Keypair</a></i>: generate a keypair from your secret key.  Share your public key for other users of this app to leave encrypted gists that only you can decode with your secret key.</li>
          <li><i><a href="/gists">GET /gists</a></i>: retrieve a list of gists for the authorized user (including private gists)</li>
          <li><i><a href="/key">GET /key</a></i>: return the secret key used for encryption of secret gists</li>
        </ul>
        <h3>Set your secret key to a specific key</h3>
        <form action="/setkey:keyString" method="get">
          Key String: <input type="text" name="keyString"><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *unencrypted* gist</h3>
        <form action="/create" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for yourself</h3>
        <form action="/createsecret" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Retrieve an *encrypted* gist you posted for yourself</h3>
        <form action="/fetchmessagefromself:id" method="get">
          Gist ID: <input type="text" name="id"><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for a friend to decode</h3>
        <form action="/postmessageforfriend" method="post">
          Name: <input type="text" name="name"><br>
          Friend's Public Key String: <input type="text" name="publicKeyString"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Retrieve an *encrypted* gist a friend has posted</h3>
        <form action="/fetchmessagefromfriend:messageString" method="get">
          String From Friend: <input type="text" name="messageString"><br>
          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
  `);
});

server.get('/keyPairGen', (req, res) => {
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
  keypair
    .then(() => {
      res.status(200).json(
        `
        <html>
          <header><title>Keypair</title></header>
          <body>
            <h1>Keypair</h1>
            <div>Share your public key with anyone you want to be able to leave you secret messages.</div>
            <div>Keep your secret key safe.  You will need it to decode messages.  Protect it like a passphrase!</div>
            <br/>
            <div>Public Key: ${keypair.publicKey}</div>
            <div>Secret Key: ${keypair.secretKey}</div>
          </body>
        </html>
      `);
    })
    .catch((err) => {
      res.status(500).json({ Error: err });
    });
});

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  github.gists.getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => { // this works!!!! Hallelujah!
  // TODO: Display the secret key used for encryption of secret gists
  console.log(nacl.util.encodeBase64(secretKeyGetter()));
  res.send(nacl.util.encodeBase64(secretKeyGetter()));
});

server.get('/setkey:keyString', (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString;
  try {
    const secretkey = nacl.util.decodeBase64(keyString);
    const keyObject = nacl.util.decodeBase64(secretkey);
    fs.writeFile('./config.json', JSON.stringify(keyObject), (errr) => {
      if (errr) {
        res.status(500).json({ Error: errr });
      } else {
        console.log(`${keyObject} is your coded key`);
      }
    });
    res.send(`Key is: ${keyString}`);
  } catch (err) {
    // failed
    res.send('Failed to set key.  Key string appears invalid.');
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
});

server.post('/create', urlencodedParser, (req, res) => {
  // Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists.create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/createsecret', urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // using someone else's public key that can be accessed and
  // viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename
});

server.get('/fetchmessagefromfriend:messageString', urlencodedParser, (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
});

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
  // const { username, oauth_token } = req.body;
  res.json({ success: false });
});

/*
  Still want to write code? Some possibilities:
  - Pretty templates! More forms!
  - Better management of gist IDs, use/display other gist fields
  - Support editing/deleting existing gists
  - Switch from symmetric to asymmetric crypto
  - Exchange keys, encrypt messages for each other, share them
  - Let the user pass in their private key via POST
*/

server.listen(3000, () => {
  console.log('Server listening on 3000');
});