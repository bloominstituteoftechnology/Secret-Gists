require('dotenv').config();
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'FJF616';
const github = octokit({ debug: true });
// Set up the encryption - use process.env.SECRET_KEY if it exists

function keyHelper() {
  const secret = process.env.SECRET_KEY;
  let genKey;
    // TODO either use or generate a new 32 byte key
  if (secret) {
    genKey = nacl.util.decodeBase64(secret);
  } else {
    genKey = nacl.randomBytes(32);
  }
  return genKey;
}
 // TODO Retrieve a list of all gists for the currently authed user
exports.getList = (req, res) => {
  github.users.getForUser({ username: `${username}` })
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((err) => {
      res.status(500).json({ message: 'An error occurred when retrieving gists.', err });
    });
};

exports.secretKey = (req, res) => {
  const key = keyHelper();
  res.send(nacl.util.encodeBase64(key));
};

exports.decryptGist = (req, res) => {
  const { id } = req.params;
  github.gists.get(id)
      .then((response) => {
        const gist = response.data;
        const key = keyHelper();
        const filename = Object.keys(gist.files)[0];
        const blob = gist.files[filename].content;
        const nonce = nacl.util.decodeBase64(blob.slice(0, 32));
        const ciphertext = nacl.util.decodeBase64(blob.slice(32, blob.length));
        const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
        res.send(nacl.util.encodeUTF8(plaintext));
      });
};
/* OPTIONAL - if you want to extend functionality */
// server.post('/login', (req, res) => {
  // TODO log in to GitHub, return success/failure response
  // This will replace hardcoded username from above
  // const { username, oauth_token } = req.body;
//   res.json({ success: false });
// });

/*
Still want to write code? Some possibilities:
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/
