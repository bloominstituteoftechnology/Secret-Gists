require("dotenv").config();
const fs = require("fs");
const bodyParser = require("body-parser");
const express = require("express");
const octokit = require("@octokit/rest");
const nacl = require("tweetnacl");
nacl.util = require("tweetnacl-util");

const username = "yshuman1"; // TODO: Replace with your username
const github = octokit({ debug: true });
const server = express();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: "oauth",
  token: process.env.GITHUB_TOKEN
});

// TODO:  Attempt to load the key from config.json.  If it is not found, create a new 32 byte key.
const data = fs.readFileSync("s./config.json");
let secretKey;

try {
  const keyObject = JSON.parse(data);
} catch (err) {
  secretKey = nacl.randomBytes(32);
  const keyObject = { secretKey: nacl.util.encodeBase64(secretKey) };
  fs.writeFile("./config.json", JSON.stringify(keyObject), fsErr => {
    if (fsErr) {
      console.log("Error saving config.json: " + fsErr.message);
    }
  });
}

server.get("/", (req, res) => {
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

server.get("/keyPairGen", (req, res) => {
  // TODO:  Generate a keypair from the secretKey and display both
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
  // Display both keys as strings
  secretKey = JSON.stringify(nacl.util.encodeBase64(keypair.secretKey));
  publicKey = JSON.stringify(nacl.util.encodeBase64(keypair.publicKey));
  res.send(`
  <html>
    <header><title>Keypair</title></header>
    <body>
      <h1>Keypair</h1>
      <div>Share your public key with anyone you want to be able to leave you secret messages.</div>
      <div>Keep your secret key safe.  You will need it to decode messages.  Protect it like a passphrase!</div>
      <br/>
      <div>Public Key: ${publicKey}</div>
      <div>Secret Key: ${secretKey}</div>
    </body>
  `);
});

server.get("/gists", (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  github.gists
    .getForUser({ username })
    .then(response => {
      res.json(response.data);
    })
    .catch(err => {
      res.json(err);
    });
});

server.get("/key", (req, res) => {
  // TODO: Display the secret key used for encryption of secret gists
  res.json(nacl.util.encodeBase64(secretKey));
});

server.get("/setkey:keyString", (req, res) => {
  // TODO: Set the key to one specified by the user or display an error if invalid
  const keyString = req.query.keyString;
  try {
    // TODO:
    secretKey = nacl.util.decodeBase64(keyString);
    res.send(`<div>new key value: ${keyString}</div>`);
  } catch (err) {
    // failed
    res.send("Failed to set key.  Key string appears invalid.");
  }
});

server.get("/fetchmessagefromself:id", (req, res) => {
  // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  //   const { id } = req.query;
  //   github.gists.get({ id })
  //     .then(response => {
  //     const gist = response.data;
  //     const filename = Object.keys(gist.files)[0];
  //     const blob = gist.files[filename].content;
  //     const [nonce, ciphertext] = blob.split(" ");
  //     nonce = nacl.util.decodeBase64(nonce);
  //     ciphertext = nacl.util.decodeBase64(ciphertext);

  //     const plaintext = nacl.secretbox.open(ciphertext, nonce, secretKey);
  //   });
  // });
  const { id } = req.query;
  let responseFiles;
  let responseContent;
  // console.log('The id provided is:', id);
  // TODO: Figure how to get a gist by ID
  github.gists
    .get({ id })
    .then(response => {
      responseFiles = response.data.files;
      for (file in responseFiles) {
        responseContent = responseFiles[file].content;
      }

      let nonce = responseContent.slice(0, 32);
      nonce = nacl.util.decodeBase64(nonce);

      let message = responseContent.slice(32, responseContent.length); // Extract Message
      message = nacl.util.decodeBase64(message);

      const decypheredBox = nacl.secretbox.open(message, nonce, secretKey);

      const utf8DecypheredBox = nacl.util.encodeUTF8(decypheredBox);

      res.json({ deciphered: utf8DecypheredBox });
    })
    .catch(err => {
      res.json(err);
    });
});

server.post("/create", urlencodedParser, (req, res) => {
  // Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists
    .create({ files, public: false })
    .then(response => {
      res.json(response.data);
    })
    .catch(err => {
      res.json(err);
    });
});

server.post("/createsecret", urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename

  const { name, content } = req.body;
  const nonce = nacl.randomBytes(nonceLength);
  const encodedContent = nacl.util.decodeUTF8(content);
  const ecryptedContent = nacl.secretbox(encodedContent, nonce, secretKey);

  const utf8EncryptedContent = nacl.util.encodeBase64(ecryptedContent);
  const utf8EncryptedNonce = nacl.util.encodeBase64(nonce);

  const files = {
    [name]: { content: `${utf8EncryptedNonce}${utf8EncryptedContent}` }
  };
  github.gists
    .create({ files, public: false })
    .then(response => {
      res.json(response.data);
    })
    .catch(err => {
      res.json(err);
    });
});

server.post("/postmessageforfriend", urlencodedParser, (req, res) => {
  // TODO:  Create a private and encrypted gist with given name/content
  // using someone else's public key that can be accessed and
  // viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename
});

server.get(
  "/fetchmessagefromfriend:messageString",
  urlencodedParser,
  (req, res) => {
    // TODO:  Retrieve and decrypt the secret gist corresponding to the given ID
  }
);

/* OPTIONAL - if you want to extend functionality */
server.post("/login", (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
  // const { username, oauth_token } = req.body;
  res.json({ success: false });
});

/*
Still want to write code? Some possibilities:
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/

server.listen(3000);
