// const { frontEnd } = require('../controllers/Frontend.js');
const { getList, secretKey, decryptGist, createGist, encryptGist } = require('../controllers/UserGistController.js');

module.exports = (app) => {
 // app.get('/', frontEnd);
  app.get('/gists', getList);
  app.get('/key', secretKey);
  app.get('/secretgist/:id', decryptGist);
  app.post('/create', createGist);
  app.post('/createsecret', encryptGist);
};
