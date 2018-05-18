This document outlines the current state of the project.  This is currently a very rough program intended to test a number of features.  As a stretch goal, take what steps you see fit to improve the usability.  

For example, after success, send a message to the user instead of simply dumping the json returned by github.  After failure, display a message to the user indicating the fault.

All remaining tasks should be completed as described in the `Expected Functionality` sections.  Most of these tasks require the generation or loading of a 32-byte secret key.

# Generate/Load Keypair

**Expected Functionality**

Generate the public key from the secret key, and display both.

**Status**

Incomplete

# GET/Gists

**Expected Functionality**

Return a JSON object containing all of the current, hardcoded user's gists.

**Status**

AFTER username is hardcoded in app.js AND a valid Github token is properly saved in .env - Functions as expected.  Upon success, a large json object is returned from github and displayed to the user.  This can be investigated for clues, such as how to find the ids of gists.

# GET/Key

**Expected Functionality**

Return a base64 string of the user's secretKey

**Status**

Incomplete

# Set Key

**Expected Functionality**

Set the user's secret key to the string they enter.

**Status**

Incomplete

# Create an unencrypted gist

**Expected Functionality**

Create a public gist in the hardcoded user's github account.

**Status**

AFTER username is hardcoded in app.js AND a valid Github token is properly saved in .env - Functions as expected.  Upon success, a large json object is returned from github and displayed to the user.  This can be investigated for clues, such as how to find the ids of gists.

# Create an encrypted gist for yourself

**Expected Functionality**

Create a secret gist with encrypted text in the hardcoded user's github account.

The nonce + encrypted string should be saved.

**Status**

Incomplete

# Retrieve an encrypted gist for yourself

**Expected Functionality**

Retrieve the secret gist with the given ID, decrypt, and display.

**Status**

Incomplete

# Create an encrypted gist for a friend to decode

**Expected Functionality**

Create a public gist with encrypted text, encrypted asymmetrically using a friend's public key and your secret key, in the hardcoded user's github account.

The nonce + encrypted string should be saved.

Your public key + the gist ID should be displayed.

**Status**

Incomplete

# Retrieve an encrypted gist a friend has posted

**Expected Functionality**

With an input string of the message sender's public key + the gist ID, use the gist ID
to retrieve the nonce + encrypted string.

Use the message receiver's secret key with the message sender's public key to decrypt.

**Status**

Incomplete