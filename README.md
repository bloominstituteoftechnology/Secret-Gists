# Secret Gists

* Save and read secure notes using GitHub gists using OAuth
* learn how to use authenticated REST API
* Learn client-side encryption and decryption


## Getting started

Authentication - aka logging in - very important to security
  O-Auth - trusted provider that handles logins and associated issues.
  Many companies provide O-Auth services
  Today we are using GitHub as an OAuth provider to store and read secret gists (snippets of text stored on GitHub)

1. Start by [reading the GitHub REST v3 API authentication info](https://developer.github.com/v3/guides/basics-of-authentication/) -
  1. the general idea is you'll need to use tokens that certify your identity, and send the appropriate HTTP requests with them. 
  2. The documentation uses Ruby/Rails in some examples, but [there is a Node.js example](https://github.com/github/platform-samples/tree/master/api/javascript/es2015-nodejs) that you should definitely look at as well.

2. For developing our app we'll use the [official Node.js GitHub library](https://github.com/octokit/node-github).


## Using Github's REST API

The [GitHub REST v3 API documentation](https://developer.github.com/v3/) shows the range of operations you can perform

### Try playing with it like below.  Just type into terminal

```
curl -i "https://api.github.com/repos/vmg/redcarpet/issues?state=closed"
```

This should cause a bunch of JSON to scroll by, with various descriptive fields like `created_at` and `url`.

### Authenticate - the most basic way to do this:

```
curl -u username https://api.github.com/user
```

1. Replace `username` with your GitHub username (keep the /user in the path the same) and press enter
2. You'll be asked for your password. Enter it and you should see returned some JSON with information about you as a GitHub user. 
3. If you have [Postman](https://www.getpostman.com) you can try this workflow using a GUI.

### Use Token Instead of Password

Typing your password each time is annoying, a better way to authorize is with an OAuth token
1. [Generate a token manually](https://github.com/settings/tokens)
2. run:  * Replace `username` and `token` with yours.

```
curl -u username:token https://api.github.com/user
```


## Starting Steps

1. Create a token with Github to access your gists and save it in the .env file (see below)
2. Run the provided code (yarn start then navigate to `localhost:3000/` in your browser)
3. Do the stuff below
4. Stretch - Redo the test page so the user can access the same functionality in a sleek react app with a nice UI/UX.

## Building an application using a REST API

- REST APIs accept HTTP requests and return (usually) JSON 
  - You can use the HTTP functionality built in to your language/framework and program the API interactions "from scratch." This is a good exercise
  - But most well-supported APIs have libraries that build the requests for you and expose objects and methods so you can interact with them naturally in your code.

- We will build our application using Express. 
  
1. The first step will be to register a new OAuth token. [Do so from the GitHub webpage](https://github.com/settings/tokens)
   - you should set it to have permission to create gists.
   - this token only displays once!!!  Treat it like a password
2. Set the token in a `.env` file in the repository. The starter file has some help with this task.  
   - Open the file called `dotenv`, paste in your token as described in the file
   - Resave the file with a new name of `.env`.  
   - Be sure to not check in the  `.env` file! It's already in `.gitignore`
3. How to use your Token
   - Environment variables can be declared in the terminal, such as the example below:

```
export GITHUB_TOKEN="yourtoken"
```

   - The token will be accessible within node as `process.env.GITHUB_TOKEN`, and can be used to authenticate the GitHub client:

```
const GitHubApi = require('github');
const github = new GitHubApi({ debug: true });

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});
```

4. Run yarn start in terminal
    1. Inspect the client you get back, and you'll see that it supports a variety of operations. 
    2. Most of these return promises - this is because performing API requests means asking for data from a machine you don't immediately control over a network.
    3. Your code needs to account for this, for example to get user information:

```
let handle = "k33g";
github.users.getForUser({username: handle}).then(response => {
    console.log(response.data);
});
```

  5. The general pattern of github is `github.noun.verb()` - essentially every entity and action possible on GitHub is accessible in this fashion
      1. You can retrieve stars, followers, repositories, or other things on a user basis
      2. If you're authorized you can also take actions (check stars on things, create repositories or gists, follow users, etc.). 
      3. Read the [documentation on the API provided by this package](https://octokit.github.io/node-github/) for more details on how to access github

## Adding client-side encryption

We will be using [TweetNaCL](https://github.com/dchest/tweetnacl-js#usage). NaCl is a fairly simple cryptosystem - it makes good default decisions using modern but well-tested algorithms. The included `package.json` also installs `tweetnacl-util`, which provides utilities for encoding between strings and bytes. Both are loaded into your code already with the code shown below.

```
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
```

Note that nacl prefers handling things as `Uint8Array` - that is, a bunch of numbers. You'll want to take a look at the `nacl.util` functions to translate between these and more user-friendly strings.

```
> nacl.util = require('tweetnacl-util');
{ decodeUTF8: [Function],
  encodeUTF8: [Function],
  encodeBase64: [Function],
  decodeBase64: [Function] }
```

Generally, the UTF8 functions are meant for the messages (UTF8 is a common encoding for human readable text), and the Base64 functions are meant for keys (you can encode the secret key to Base64 before giving it to the user to save "offline", and then decode it back from Base64 when reinitializing their keypair).

Getting this to work will require some experimentation - start `node` from the command line, require the modules, and interact with them. In general, you'll need `encodeUTF8 / decodeUTF8` functions to translate between human-readable text (the gist content you care about) and the
[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) that nacl works with natively. You'll also need the
`encodeBase64 / decodeBase64` functions to translate keys/nonces/ciphertext into representations that can be returned as a string (but aren't intended to be human readable).

### Symmetric crypto

Symmetric cryptography is done using `nacl.secretbox()`, and requires a single secret key as well as a unique random nonce on each execution. The output blob should be saved along with the nonce, which will then be used to decrypt it later. The nonce should be 24 bytes long and the key should be 32 bytes (the default values for nacl).

Both the key and nonce need to use good randomness - `nacl.randomBytes(length)` will provide this. You will also want to give the secret key to the user so they can save it ("offline" - assume they can keep it safe, like a passphrase) and use it later to decrypt things. Since asking users to save an array of numbers isn't great, use the utility functions to encode it for them. To read it back, for now you can just set it as an environment variable similar to the OAuth token.

Once you've encrypted the content of the gist, make sure to also include the nonce, otherwise you won't be able to decrypt it. The nonce can just be prepended to the encrypted content, and then the whole thing can be encoded and returned/saved as appropriate.

To decrypt, reverse the process - pick off the nonce, decode both nonce and encrypted content, decrypt the content with the nonce and the key, and return.

### Asymmetric crypto (optional)

The first thing you'll have to do is use `nacl.box.keyPair()` to generate a new public/private keypair. To regenerate the same keypair later, you should let the user retrieve their own private key (referred to as `secretKey` in nacl), and then when they start the application again setup with `nacl.box.keyPair.fromSecretKey(secretKey)`.

Once set up, nacl supports the standard range of asymmetric crypto operations - sign, encrypt, verify, decrypt. The "box/unbox" methods combine sign/encrypt and verify/decrypt, to make your life as a developer a bit easier. The main difference you'll have to worry about is returning both the public and private key to the user, and reinitializing the keypair from the private one.

At first box/unbox with the whole keypair, but you can add methods/routes to support passing in the public keys of other users - this would let you encrypt for them (so only they can decrypt), while signing with your private key (so they can verify the message really came from you by using your public key).

### Going further

There is a stubbed `/login` route and some suggestive comments at bottom of `app.js` - if you are interested, it's highly encouraged to take this app even further. In general, this could grow into a secure pastebin, where users can share notes and secrets with each other and not have to trust the host. This exploration is beyond the scope of your initial work, but is good to think about and absolutely worth exploring if you are so inclined.
