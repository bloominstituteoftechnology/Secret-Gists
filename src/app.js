/* eslint-disable eol-last */
/* eslint-disable no-console */
/* eslint-disable no-else-return */
/* eslint-disable quotes */
/* eslint-disable dot-notaton */
/* eslint-disable no-constant-condition */
/* eslint-disable no-lonely-if */
/* eslint-disable camelcase */

require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const github = octokit({ debug: true });
const server = express();
const MY_SECRET = process.env.MY_SECRET || process.env.MY_RANDOM_SECRET;
// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.
// const data = fs.readFileSync('message.txt')
// const fd = fs.openSync('message.txt', 'w+')
// const insert = new Buffer("text to prepend \n")
// fs.writeSync(fd, insert, 0, insert.length, 0)
// fs.writeSync(fd, data, 0, data.length, insert.length)
// fs.close(fd)
const secretKeyGetter = () => {
  if (MY_SECRET) {
    const SECRET = nacl.util.encodeBase64(MY_SECRET);
    console.log(`You already have a secret ${SECRET}`);
  } else {
    const SECRET = nacl.box.keyPair().secretKey;
    const data = fs.readFileSync('./.env');
    const fd = fs.openSync('./.env', 'a');
    const insert = (`MY_RANDOM_SECRET=${nacl.util.encodeBase64(SECRET)}\n`);
    fs.writeSync(fd, insert, data.length, ((error, written = 32, str) => {
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
    })
    );
  }
};

const validatePW = (password) => {
  return (password === process.env.GITHUB_PASSWORD ? true : console.log("password not correct"));
};

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  secretKeyGetter();
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
  const keypair = (nacl.box.keyPair.fromSecretKey(nacl.util.decodeBase64(MY_SECRET)));
  console.log(
    "keypair", { public: nacl.util.encodeBase64(keypair.publicKey),
      private: nacl.util.encodeBase64(keypair.secretKey) });
  res.send(
    `
    <html>
      <header><title>Keypair</title></header>
      <body>
        <h1>Keypair</h1>
        <div>Share your public key with anyone you want to be able to leave you secret messages.</div>
        <div>Keep your secret key safe.  You will need it to decode messages.  Protect it like a passphrase!</div>
        <br/>
        <div>Public Key: ${nacl.util.encodeBase64(keypair.publicKey)}</div>
        <div>Secret Key: ${nacl.util.encodeBase64(keypair.secretKey)}</div>
      </body>
    </html>
  `);
});

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  const username = process.env.GITHUB_USERNAME;
  github.gists.getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO: Display the secret key used for encryption of secret gists
  console.log(nacl.util.encodeBase64(MY_SECRET));
  res.send(nacl.util.encodeBase64(MY_SECRET));
});

server.get('/setkey:keyString', (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString;
  try {
    const SECRET = keyString;
    const buffer = `\nMY_SECRET=${nacl.util.encodeBase64(SECRET)}\n`;
    fs.open('./.env', 'a', (err, fd) => {
      if (err) {
        console.log({ err });
      } else {
        console.log(".env file opened successfully!");
      }
      fs.write(fd, buffer, (error, written = 32, str) => {
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
    });
    res.send(`Key is: ${nacl.util.encodeBase64(keyString)}`);
  } catch (err) {
    // failed
    res.send('Failed to set key.  Key string appears invalid.');
  }
});

server.get('/fetchmessagefromself:id', (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  // Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.query.id;
  github.gists.get({ id }).then((response) => {
    const gist = response.data;
    const resFile = Object.keys(gist.files)[0];
    const resContent = gist.files[resFile].content;
    const MY_SECRET_OPEN = nacl.util.decodeBase64(MY_SECRET);
    const nonce = nacl.util.decodeBase64(resContent.slice(0, 32));
    const ciphertext = nacl.util.decodeBase64(resContent.slice(32, resContent.length));
    const plaintext = nacl.secretbox.open(ciphertext, nonce, MY_SECRET_OPEN);
    console.log(plaintext);
    res.send(nacl.util.encodeUTF8(plaintext));
  });
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
  const { name, content } = req.body;
  // use nonce - a one-time use salt type thing to make it harder to crack if secret key is compromised
  const nonce = nacl.randomBytes(24);
  console.log(nonce, "nonce");
  // encrypt the content only
  const decodeContent = nacl.util.decodeUTF8(content);
  console.log('decodeContent', decodeContent);
  const secretkey = nacl.util.decodeBase64(MY_SECRET);
  console.log('secretkey encryptedgist', secretkey);
  const ciphertext = nacl.secretbox(decodeContent, nonce, secretkey);
  // append or prepend nonce to our encrypted content.
  console.log('ciphertext', ciphertext);
  const ciphertextAndNonce = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(ciphertext);
  // save to file that Github requires for gist
  const file = { [name]: { content: ciphertextAndNonce } };
  // send post request to Githib
  github.gists
    .create({ files: file, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err.message);
    });
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // using someone else's public key that can be accessed and
  // viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename
  const keypair = nacl.box.keyPair.fromSecretKey(MY_SECRET);
  const { name, publicKeyString, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const ciphertext = nacl.box(nacl.util.decodeUTF8(content), nonce,
    nacl.util.decodeBase64(publicKeyString), nacl.util.decodeBase64(MY_SECRET));
  // To save, we need to keep both encrypted content and nonce
  const resContent = nacl.util.encodeBase64(nonce) +
        nacl.util.encodeBase64(ciphertext);
  const files = { [name]: { content: resContent } };
  github.gists.create({ files, public: true })
    .then((response) => {
      // Display a string that is the messager's public key + encrypted message blob
      // to share with the friend.
      const messageString = nacl.util.encodeBase64(keypair.publicKey) + response.data.id;
      res.send(`
        <html>
          <header><title>Message Saved</title></header>
          <body>
            <div>
            <h1>Message Saved!</h1>
            <div>Give this string to your friend for decoding:</div>
            <div>${messageString}</div>
            </div>
          </body>
        </html>
      `);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/fetchmessagefromfriend:messageString', urlencodedParser, (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  const messageString = req.query.messageString;
  const friendPublicString = messageString.slice(0, 44);
  const id = messageString.slice(44, messageString.length);

  github.gists.get({ id }).then((response) => {
    const gist = response.data;
    const resFile = Object.keys(gist.files)[0];
    const resContent = gist.files[resFile].content;
    const nonce = nacl.util.decodeBase64(resContent.slice(0, 32));
    const ciphertext = nacl.util.decodeBase64(resContent.slice(32, resContent.length));
    const plaintext = nacl.box.open(ciphertext, nonce,
      nacl.util.decodeBase64(friendPublicString),
      nacl.util.decodeBase64(MY_SECRET)
    );
    res.send(nacl.util.encodeUTF8(plaintext));
  });
});
/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => { // pretty sure this doesn't work. thought I would try anyway.
  console.log(req.body);
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "login/username and password are required to login" });
  } else {
    ({ username })
      .then((user) => {
        if (user) {
          user
            .validatePW(password)
            .then((passwordsMatch) => {
              if (passwordsMatch) {
                github.authorization.create({ note: "personal access token" })
                .then((result) => {
                  res.status(200).json(`Welcome ${username}. Have a secret. ${MY_SECRET}`);
                })
                .catch((err) => {
                  res.status(500).json(err.message);
                });
              }
            })
            .catch((err) => {
              res.status(500).json(err.message);
            });
        }
      })
      .catch((err) => {
        res.status(500).json(err.message);
      });
  }
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