const bodyParser = require('body-parser');
const express = require('express');
const GitHubApi = require('github');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

// jsonfile to persist the key
const jsonfile = require('jsonfile')
var jfile = 'data.json'

// require('dotenv').config({ path: '/Users/squeel/lambda/Secret-Gists/.env' })

const username = 'dasqueel';  // TODO: your GitHub username here
const github = new GitHubApi({ debug: true });
const server = express();
server.use(bodyParser.json())

// console.log(process.env.GITHUB_TOKEN);
// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

// Set up the encryption - use process.env.SECRET_KEY if it exists
// TODO either use or generate a new 32 byte key
let key;
jsonfile.readFile(jfile, (err, obj) => {
  // console.dir(obj)
  // return obj.SECRET_KEY ? nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);
  if (obj.SECRET_KEY) {
    key = obj.SECRET_KEY
  }
  else {
    const newObj = { "SECRET_KEY": nacl.randomBytes(32) };
    jsonfile.writeFile(jfile, newObj, (err) => {
      console.error(err)
    })
  }
})

// const key = process.env.SECRET_KEY ? 
//       nacl.util.decodeBase64(process.env.SECRET_KEY) : nacl.randomBytes(32);

// console.log(nacl.randomBytes(32))
// process.env.SECRET_KEY = key;
// console.log(key)

server.get('/', (req, res) => {
  // TODO Return a response that documents the other routes/operations available
  resp = 'get /gists<br>get /key<br>get /secretgist/:id<br>post /create<br>post /createsecret<br>post /login'
  res.send(resp);
});

server.get('/gists', (req, res) => {
  // TODO Retrieve a list of all gists for the currently authed user
  let handle = "dasqueel";
  github.gists.getForUser({ username: handle }).then(response => {
    // console.log(response.data);
    res.json(response.data);
  });
});

server.get('/key', (req, res) => {
  // TODO Return the secret key used for encryption of secret gists
  // pairs = nacl.box.keyPair();
  // res.json(pairs.secretKey);
  // let key = nacl.randomBytes(32);
  // let nonce = nacl.randomBytes(24);
  // nacl.secretbox(content, nonce, key);
  res.send(nacl.util.encodeBase64(key));
});

server.get('/secretgist/:id', (req, res) => {
  // TODO Retrieve and decrypt the secret gist corresponding to the given ID
  const id = req.params.id;

  github.gists.get({ id })
    .then(resp => {
      const gist = resp.data;

      // the file name is found in the key of gist json
      const filename = Object.keys(gist.files)[0];
      const blob = gist.files[filename].content;

      const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
      const cipherText = nacl.util.decodeBase64(blob.slice(32, blog.length));
      const plainText = nacl.secretbox.open(cipherText, nonce, key);
      res.send(nacl.util.encodeUTF8(plainText));
    })
});

server.post('/create', (req, res) => {
  // TODO Create a private gist with name and content given in post request
  // let files = {};
  // files.filename = "test name";
  // let files = {
  //   "TEST_2.md": {
  //     "content": "<html><h1>This is a Test!</h1><b>Hello</b><img src=></html>"
  //   }
  // }
  const { name, content } = req.body;
  const files = { [name]: { content } };

  github.gists.create({ files, public : false })
  .then(result => {
    res.json(result);
  })
  .catch(err => res.json(err))
});

server.post('/createsecret', (req, res) => {
  // TODO Create a private and encrypted gist with given name/content
  // NOTE - we're only encrypting the content, not the filename
  // To save, we need to keep both encrypted content and nonce
  // console.log(req.body);
  // console.log(req.params);
  const { name, content } = req.body;
  const nonce = nacl.randomBytes(24);
  const cipherText = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key);

  const blob = `${nacl.util.encodeBase64(nonce)}${nacl.util.encodeBase64(cipherText)}`;

  const files = { [name] : { content : blob } };

  github.gists.create({ files, public : false})
    .then(resp => res.json(resp.data))
    .catch(err => res.json(err));
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
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/

server.listen(3000);
