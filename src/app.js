require('dotenv').config()

const server = require('express')()
const config = require('./api/config')

require('./api/express')(server, config)
require('./api/routes')(server)

server.listen(config.port, (err) => {
  /* eslint no-console: 0 */
  if (err) console.log(err)
  console.log('Express server is 👂 on port 8000')
})
