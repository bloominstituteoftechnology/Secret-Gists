require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'petergraycreative'; // TODO: Replace with your username
const github = octokit({ debug: true });
const server = express();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN,
});

const encryptionFunctions = {
  getNonce: () => {
    return nacl.randomBytes(24);
  },
  encodeKey: (key) => {
    if (key) {
      return nacl.util.encodeBase64(key);
    }
    return nacl.util.encodeBase64(process.env.SECRET_KEY);
  },
  decodeKey: (key) => {
    if (key) {
      return nacl.util.decodeBase64(key);
    }
    return nacl.util.decodeBase64(process.env.SECRET_KEY);
  },
  encryptContent: (content, nonce, publicKey) => {
    if (content) {
      let blob;
      if (publicKey !== undefined) {
        const pKey = encryptionFunctions.decodeKey(publicKey);
        const encodedNonce = nacl.util.encodeBase64(nonce);
        const sKey = encryptionFunctions.decodeKey();
        const myPubKey = nacl.util.encodeBase64(
          nacl.box.keyPair.fromSecretKey(sKey).publicKey
        );
        const decodedContent = nacl.util.decodeUTF8(content);
        const encryptedContent = nacl.util.encodeBase64(
          nacl.box(decodedContent, nonce, pKey, sKey)
        );
        blob = `${myPubKey}\n${encodedNonce}\n${encryptedContent}`;
      } else {
        const encodedNonce = nacl.util.encodeBase64(nonce);
        const key = encryptionFunctions.decodeKey();
        const decodedContent = nacl.util.decodeUTF8(content);
        const encryptedContent = nacl.util.encodeBase64(
          nacl.secretbox(decodedContent, nonce, key)
        );
        blob = `${encodedNonce}\n${encryptedContent}`;
      }
      return blob;
    }
    return { error: 'Please provide content' };
  },
  decryptContent: (content) => {
    let parsedContent;
    if (content) {
      parsedContent = content.split(' ');
      console.log(parsedContent, parsedContent.length);
      let decodedContent;
      let decryptedContent;
      const sKey = encryptionFunctions.decodeKey();
      if (parsedContent.length > 2) {
        const pubKey = nacl.util.decodeBase64(parsedContent[0]);
        const nonce = nacl.util.decodeBase64(parsedContent[1]);

        decodedContent = nacl.util.decodeBase64(parsedContent[2]);
        decryptedContent = nacl.box.open(decodedContent, nonce, pubKey, sKey);
      } else {
        parsedContent = content.split('\n');
        const nonce = nacl.util.decodeBase64(parsedContent[0]);

        decodedContent = nacl.util.decodeBase64(parsedContent[1]);

        decryptedContent = nacl.secretbox.open(decodedContent, nonce, sKey);
      }
      return nacl.util.encodeUTF8(decryptedContent);
    }
    return { error: 'Please provide content' };
  },
};

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO:  Use the existing key or generate a new 32 byte key

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
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
          <li><i><a href="/keyPairGen">Generate Keypair</a></i>: Generate a keypair.  Share your public key for other users of this app to leave encrypted gists that only you can decode with your secret key.</li>
        </ul>
        <h3>Create an *unencrypted* gist</h3> <!-- Done -->
        <form action="/create" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist</h3> <!-- Done -->
        <form action="/createsecret" method="post">
          Name: <input type="text" name="name"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Create an *encrypted* gist for a friend to decode</h3> <!-- Done -->
        <form action="/postmessageforfriend" method="post">
          Name: <input type="text" name="name"><br>
          Friend's Public Key: <input type="text" name="publicKey"><br>
          Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
          <input type="submit" value="Submit">
        </form>
        <h3>Retrieve an *encrypted* gist a friend has posted</h3> <!-- Next -->
        <form action="/fetchmessagefromfriend" method="post">
          String From Friend: <input type="text" name="messageString"><br>
          <input type="submit" value="Submit">
        </form>
      </body>
    </html>
  `);
});

server.get('/gists', (req, res) => {
  // Retrieve a list of all gists for the currently authed user
  github.gists
    .getForUser({ username })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  const key = encryptionFunctions.decodeKey();

  res.json({ 'Secret Key': process.env.SECRET_KEY });
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const { id } = req.params;
  github.gists
    .get({ id })
    .then(({ data }) => {
      const files = data.files[Object.keys(data.files)[0]];
      const content = encryptionFunctions.decryptContent(files.content);
      const title = files.filename;

      res.json({ title: content });
    })
    .catch((err) => {
      res.json(err);
    });
});

server.get('/keyPairGen', (req, res) => {
  const { key } = req.query;
  let keypair;
  if (key !== undefined) {
    const decodeKey = encryptionFunctions.decodeKey(key);
    keypair = nacl.box.keyPair.fromSecretKey(decodeKey);
  } else {
    keypair = nacl.box.keyPair();
  }

  // Display the keys as strings
  res.send(`
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
  `);
});

server.post('/create', urlencodedParser, (req, res) => {
  // Create a private gist with name and content given in post request
  const { name, content } = req.body;
  const files = { [name]: { content } };
  github.gists
    .create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/createsecret', urlencodedParser, (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  const { name, content } = req.body;
  // encrypt content
  const nonce = encryptionFunctions.getNonce();

  const encryptedContent = encryptionFunctions.encryptContent(content, nonce);

  const files = { [name]: { content: encryptedContent } };

  github.gists
    .create({ files, public: false })
    .then((response) => {
      res.json(response.data);
    })
    .catch((err) => {
      res.json(err);
    });
});

server.post('/postmessageforfriend', urlencodedParser, (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // using someone else's public key that can be accessed and
  // viewed only by the person with the matching private key
  // NOTE - we're only encrypting the content, not the filename
  const savedKey = process.env.SECRET_KEY;
  if (savedKey === undefined) {
    // Must create saved key first
    res.send(`
    <html>
      <header><title>No Keypair</title></header>
      <body>
        <h1>Error</h1>
        <div>You must create a keypair before using this feature.</div>
      </body>
    `);
  } else {
    const { name, content, publicKey } = req.body;
    // encrypt content
    const nonce = encryptionFunctions.getNonce();

    const encryptedContent = encryptionFunctions.encryptContent(
      content,
      nonce,
      publicKey
    );

    const files = { [name]: { content: encryptedContent } };

    github.gists
      .create({ files, public: true })
      .then((response) => {
        // TODO Build string that is the messager's public key + encrypted message blob
        // to share with the friend.
        const messageString = encryptedContent;

        // Display the string built above
        res.send(`
        <html>
          <header><title>Message Saved</title></header>
          <body>
            <h1>Message Saved</h1>
            <div>Give this string to your friend for decoding.</div>
            <div>${messageString}</div>
            <div>
          </body>
        `);
      })
      .catch((err) => {
        res.json(err);
      });
  }
});

server.post(
  '/fetchmessagefromfriend',
  urlencodedParser,
  (req, res) => {
    const { messageString } = req.body;
    console.log(messageString[0]);
    const decrypted = encryptionFunctions.decryptContent(messageString);
    res.json({ message: decrypted });
  }
);

/* OPTIONAL - if you want to extend functionality */
server.post('/login', (req, res) => {
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
