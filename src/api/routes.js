const controller = require('./controllers')

module.exports = (server) => {
  server.get('/', controller.welcome)
  server.get('/gists', controller.gists)
  server.get('/key', controller.key)
  server.get('/secretgist/:id', controller.secretgist)
  server.post('/create', controller.create)
  server.post('/createsecret', controller.createsecret)
  server.post('/login', controller.login)
}
