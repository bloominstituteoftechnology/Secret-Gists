module.exports = (nacl, keypair) => `<html>
<header><title>Keypair</title></header>
<body>
  <h1>Keypair</h1>
  <div>Share your public key with anyone you want to be able to leave you secret messages.</div>
  <div>Keep your secret key safe.  You will need it to decode messages.  Protect it like a passphrase!</div>
  <br/>
  <div>Public Key: ${nacl.util.encodeBase64(keypair.publicKey)}</div>
  <div>Secret Key: ${nacl.util.encodeBase64(keypair.secretKey)}</div>
</body>
</html>`;
