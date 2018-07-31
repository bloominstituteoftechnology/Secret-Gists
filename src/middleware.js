const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const generateKeypair = () => {
  const generatedKeys = nacl.box.keyPair();
  return {
    publicKey: generatedKeys.publicKey,
    secretKey: generatedKeys.secretKey
  };
};

const saveSecretKey = (keypair, configPath) => {
  const data = JSON.stringify({
    secretKey: nacl.util.encodeBase64(keypair.secretKey)
  });

  fs.writeFile(configPath, data, (err) => {
    if (err) throw err;
  });
};

const getKeypair = (req, res, next) => {
  const configPath = path.join(__dirname, './config.json');
  fs.readFile(configPath, 'utf8', (err, contents) => {
    if (!err) {
      const encodedSecretKey = JSON.parse(contents);

      if (encodedSecretKey.secretKey) {
        const decodedSecretKey = nacl.util.decodeBase64(
          encodedSecretKey.secretKey
        );
        req.keypair = nacl.box.keyPair.fromSecretKey(decodedSecretKey);
        next();
        return;
      }
    }

    req.keypair = generateKeypair();
    saveSecretKey(req.keypair, configPath);
    next();
  });
};

module.exports = {
  getKeypair
};
