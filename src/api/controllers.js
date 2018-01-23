const GitHubApi = require('github')
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')

const config = require('./config')

const gh = new GitHubApi({ debug: true })

gh.authenticate({
  type: 'oauth',
  token: config.gh_token
})

const key = nacl.util.decodeBase64(config.secret)

module.exports = {
  welcome: async (req, res) => {
    res.status(200).send(`<div>
      <h1>👋 Welcome to Secret Gists API!</h1>
      <p>The following endpoints are available:<br />
      /gists — GET — Return a list of user's gists<br />
      /key — GET — Return the secret key used for encryption of secret gists<br />
      /secretgists/:id — GET — Return the decrypt secret gist corresponding to the given ID<br />
      /create — POST — Create a private gist with name and content given in post request<br />
      /createsecret — POST — Create a private and encrypted gist with given name and content<br />
      /login — POST — Log in to your GitHub</p></div>`)
  },

  gists: async (req, res) => {
    try {
      const list = await gh.gists.getAll({})
      res.status(200).json(list)
    } catch (err) {
      res.status(422).json(err)
    }
  },

  key: (req, res) => res.json(key),

  secretgist: async (req, res) => {
    try {
      const { id } = req.params
      const gist = await gh.gists.get({ id })
      const encrypted = Object.values(gist.data.files)[0].content
      const nonce = nacl.util.decodeBase64(encrypted.substring(0, 32))
      const content = nacl.util.decodeBase64(encrypted.substring(32, encrypted.length))
      const decrypted = nacl.secretbox.open(content, nonce, key)
      res.status(200).send(nacl.util.encodeUTF8(decrypted))
    } catch (err) {
      res.status(422).json(err)
    }
  },

  create: async (req, res) => {
    try {
      const { name, content } = req.body
      const post = await gh.gists.create({ files: { [name]: { content } }, public: false })
      res.status(200).json({ Success: 'Secret Gist posted!' })
    } catch (err) {
      res.status(422).json(err)
    }
  },

  createsecret: async (req, res) => {
    try {
      const { name, content } = req.body
      const nonce = nacl.randomBytes(24)
      const encrypted = nacl.secretbox(nacl.util.decodeUTF8(content), nonce, key)
      const post = nacl.util.encodeBase64(nonce) + nacl.util.encodeBase64(encrypted)
      await gh.gists.create({ files: { [name]: { content: post } }, public: false })
      res.status(200).json({ Success: 'Gist posted!', Secret: post })
    } catch (err) {
      res.status(422).json(err)
    }
  },

  login: async (req, res) => {
    // TODO log in to GitHub, return success/failure response
    // This will replace hardcoded username from above
    // const { username, oauth_token } = req.body;
    res.send('login endpoint')
  }
}
