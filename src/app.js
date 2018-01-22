require('dotenv').config()

const server = require('express')()
const config = require('./config/config')

require('./config/express')(server, config)
require('./config/routes')(server)

server.listen(config.port, (err) => {
  /* eslint no-console: 0 */
  if (err) console.log(err)
  console.log('Express server is 👂 on port 8000')
})

/*
Still want to write code? Some possibilities:
-Pretty templates! More forms!
-Better management of gist IDs, use/display other gist fields
-Support editing/deleting existing gists
-Switch from symmetric to asymmetric crypto
-Exchange keys, encrypt messages for each other, share them
-Let the user pass in their private key via POST
*/

const GitHubApi = require('github')
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')

const username = config.gh_username
const github = new GitHubApi({ debug: true })

// Generate an access token: https://github.com/settings/tokens
// Set it to be able to create gists
github.authenticate({
  type: 'oauth',
  token: config.gh_token
})
