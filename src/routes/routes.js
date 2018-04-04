// const { FrontEnd } = require('../controllers/FrontendController.js');
const { getList, secretKey, decryptGist, createGist, encryptGist } = require('../controllers/GetControllers.js');

module.exports = (app) => {
  // app.get('/', frontEnd);
  app.get('/gists', getList);
  app.get('/key', secretKey);
  app.get('/secretgist/:id', decryptGist);
  app.post('/create', createGist);
  app.post('/createsecret', encryptGist);
};
