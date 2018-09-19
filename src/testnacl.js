// /* eslint-disable no-console */

// require('dotenv').config();
// const fs = require('fs');
// const bodyParser = require('body-parser');
// const express = require('express');
// const octokit = require('@octokit/rest');
// const nacl = require('tweetnacl');
// nacl.util = require('tweetnacl-util');
// const key = nacl.randomBytes(32);

// // /* Encrypt */
// // we start with plain text
// // we turn that plain text into a UINT8 Array
// // we then create a nonce, which is 24 random bytes in a UINT8 Array
// // then we create a box, which takes 3 paramaters in uint8 format
// // the message, the nonce, and the key
// // now from reading the docs I thought that was the encrypted message
// // but apparently there is one more step, one that I still cannot find
// // on the docs provided me, and that is to take that box and the nonce
// // again, turn them both into base64, and concanenate them together, and
// // that blob output is the actual encrypted content
// const content = 'antidiluvian';
// const uint8Content = nacl.util.decodeUTF8(content);
// const nonce = nacl.randomBytes(24);
// const box = nacl.secretbox(uint8Content, nonce, key);
// const encrypted = nacl.util.encodeBase64(box) + nacl.util.encodeBase64(nonce);

// /* De-crypt */
// // so to decrypt it we go back the other way
// // we slice the nonce and the message
// // after separating the nonce and message
//
// //
// const encryptedNonce = encrypted.slice(-32);
// const encryptedContent = encrypted.slice(0, -32);
// console.log("Encrypted Content: ", encryptedContent);
// const decodedNonce = nacl.util.decodeBase64(encryptedNonce);
// const decodedContent = nacl.util.decodeBase64(encryptedContent);
// console.log("Decoded Content: ", decodedContent);
// const openedBox = nacl.secretbox.open(decodedContent, decodedNonce, key);
// console.log("Opened Box: ", openedBox);
// const decrypted = nacl.util.encodeUTF8(openedBox);
// console.log("Decrypted Message: ", decrypted);

// // lines 13, 16, and 19 in reverse
// // const message = 'antidiluvian';

// // const nonce = nacl.randomBytes(24);
// // // this is the box!!!!!!!!!!!111111

// // // console.log(uint8Message);
// // // console.log(cryptoContent);
// // // also called a blob
// // const encryptedMessage = nacl.util.encodeBase64(cryptoContent) + nacl.util.encodeBase64(nonce);
// // const slicedNonce = encryptedMessage.slice(-32);
// // const slicedContent = encryptedMessage.slice(0, -32);
// // // console.log(slicedContent.length);
// // // console.log(slicedNonce.length);
// // const decodedSlicedNonce = nacl.util.decodeBase64(slicedNonce);
// // // this is the box!!!!!11
// // const decodedSlicedContent = nacl.util.decodeBase64(slicedContent);

// // const openedBox = nacl.secretbox.open(cryptoContent, decodedSlicedNonce, key);
// // const decryptedMessage = nacl.util.encodeUTF8(openedBox);
// // console.log(decryptedMessage);
// // // console.log(cryptoContent, decodedSlicedContent);
// // // const decryptedContent = nacl.secretbox.open(cryptoContent, nonce, key);
// // // const plainTextDecrypted = nacl.util.encodeUTF8(decryptedContent);
// // // console.log(decryptedContent);
// // // console.log(plainTextDecrypted);

