/* eslint-disable no-console */

// the required libraries needed to successfully complete the project
require('dotenv').config();
const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const octokit = require('@octokit/rest');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const username = 'tramanedhall'; // declaring my github username as a const
const github = octokit({ debug: true });
const server = express();
const MY_SECRET = process.env.MY_SECRET || process.env.MY_OTHER_SECRET; // provisioning so that we are able to generate keys that grant access to the secret gists

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});

/*
I want to create a function "getTheKey" that uses MY_SECRET to load the key from config.json.
if the key is not present then a new key will be created using nacl to generate a key.
*/
const getTheKey = () => {
    if(MY_SECRET) { // If there is a key MY_SECRET in the config.json, then I am going to encode it using Base-64 encoding and return the encoded key
        const SECRET = nacl.util.encodeBase64(MY_SECRET);
        return SECRET;
    } else { //If there is no key, I am going to generate a new encoded key, open/create a new .env file, insert the new key into that file, then overwite/save the new file
        const SECRET = nacl.box.keyPair().secretKey; // generating a new random key pair for box that will be returned as an objec with publicKey and secretKey
        const data = fs.readFileSync('./.env'); // returns the contents of the .env file
        const fd = fs.openSync('./env', 'a'); // Opens/creates a new file that can be appended
        const insert = (`MY_OTHER_SECRET= ${nacl.util.encodeBase64(SECRET)}\n`); // I'm creating a new encoded key if there is not already one present in the file
        fs.writeSync(fd, insert, data.length, ((error, written = 32, str) => {
            if(error) { // if there is an issue in opening/updating the file, an error message is thrown
                console.log({ error });
            } else { // if there is no error, a success message is printed
                console.log("File was updated successfully!");
            }
            fs.close(fd, (errors) => {
                if (errors) { // if there errors when closing the updated file then an error message is thrown
                    console.log({ errors });
                } else { //if there is no error closing the file, a success message is shown
                    console.log("File was closed successfully");
                }
            });
        })
    ); 

}

server.get('/', (req, res) => {
  // Return a response that documents the other routes/operations available
  getTheKey(); // invoking my getTheKey function
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
    //TODO: generate a keypair from the secretKey and display both
    const keypair = (nacl.box.keyPair()); // creates new keypair object
    console.log(
        "keypair", { public: nacl.util.encodeBase64(keypair.publicKey), private: nacl.util.encodeBase64(keypair.secretKey)
        }); 
    // Displays the encoded keys as strings
    res.send (` 
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

server.get
