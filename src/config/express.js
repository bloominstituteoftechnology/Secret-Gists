const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')

module.exports = (server, config) => {
  server.use(bodyParser.json())
  server.use(logger('dev'))
}
