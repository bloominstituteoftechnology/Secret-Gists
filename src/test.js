const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

let data = "This is some data";
let nonce = nacl.randomBytes(24);
let key = nacl.randomBytes(32);
//console.log(data);
data = nacl.util.decodeUTF8(data);
//console.log(data);

// nonce = nacl.util.encodeBase64(nonce);
// console.log(nonce);
// nonce = nacl.util.decodeBase64(nonce);
// console.log(nonce);

let cipher = nacl.secretbox(data, nonce, key);
cipher = nacl.util.encodeBase64(cipher);
nonce = nacl.util.encodeBase64(nonce);
console.log(cipher);
console.log(nonce);
let encryptedContent = nonce + cipher;
console.log(encryptedContent);
nonce = encryptedContent.slice(0,32);
cipher = encryptedContent.slice(32);
console.log(nonce);
console.log(cipher);
nonce = nacl.util.decodeBase64(nonce);
cipher = nacl.util.decodeBase64(cipher);

let content = nacl.secretbox.open(cipher, nonce, key);
content = nacl.util.encodeUTF8(content);
console.log(content);
console.log(key);


// cipher = nacl.secretbox.open(cipher, nonce, key);
// cipher = nacl.util.encodeUTF8(cipher);
// console.log(cipher);