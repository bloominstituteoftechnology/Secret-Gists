const bodyParser = require('body-parser')
const logger = require('morgan')
const cors = require('cors')

const options = {
  origin: '*',
  methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}

module.exports = (server) => {
  server.use(bodyParser.json())
  server.use(logger('dev'))
  server.use(cors(options))
}
