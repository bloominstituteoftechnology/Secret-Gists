# Secret Gists
Save and read secure notes using GitHub gists


## Audience and Purpose

Audience: Node.js developers, CS students, security enthusiasts

* Learn about OAuth
* Learn how to use an authenticated REST API
* Learn how to do simple client-side encryption/decryption using existing libraries

## Tasks

Create a token with Github to access your gists and save it in the .env file (see below)

Run the provided code (yarn start then navigate to localhost:3000/ in your browser)

Review the functionality implemented in this temporary test page.  See spec.md for more details on current and expected functionality.   

Use the existing functionality as a guide to implement new features making use
of encryption.

Stretch:  Redo the test page so the user can access the same functionality in a sleek react app with a nice UI/UX.

## Getting started

Authentication (logging a user in and ensuring they and only they have access to
their information) is one of the most important security aspects of a modern Web
application. A common practice is to use [OAuth](https://en.wikipedia.org/wiki/OAuth),
which allows your application to depend on a trusted provider that manages user
logins and the associated issues (multifactor authentication, password recovery,
etc.). [Many major tech companies provide this](https://en.wikipedia.org/wiki/List_of_OAuth_providers) -
for our purposes we're building an app to store and read secret gists (snippets
of text stored on GitHub), so we'll be using GitHub as a provider.

Start by [reading the GitHub REST v3 API authentication info](https://developer.github.com/v3/guides/basics-of-authentication/) -
it's okay if some of it doesn't make sense yet, but the general idea is you'll
need to use tokens that certify your identity, and send the appropriate HTTP
requests with them. The documentation uses Ruby/Rails in some examples, but
[there is a Node.js example](https://github.com/github/platform-samples/tree/master/api/javascript/es2015-nodejs)
that you should definitely look at as well.

For developing our app we'll use the [official Node.js GitHub library](https://github.com/octokit/node-github).


## Interactively using a REST API

The [GitHub REST v3 API documentation](https://developer.github.com/v3/) shows the
range of operations you can perform, and before development you should try playing
with a few of the examples using `curl` (should be available in whatever package
manager your operating system uses). Many of the basic operations don't require
authentication, as they just retrieve public data. For an example, try running:

```
curl -i "https://api.github.com/repos/vmg/redcarpet/issues?state=closed"
```

This should cause a bunch of JSON (the format the API uses to return data) to
scroll by, with various descriptive fields like `created_at` and `url`.

After a few non-authenticated operations, the next step is to authenticate. The
most basic way to do this:

```
curl -u username https://api.github.com/user
```

Replace `username` with your GitHub username (keep the /user in the path the
same), and after running that command you'll be asked for your password.
Enter it and you should see returned some JSON with information about you as a
GitHub user. If you have [Postman](https://www.getpostman.com) or similar
installed you can also try this workflow using a GUI.

Interactively typing your password is burdensome and not a great practice - a
better way to authorize is with an OAuth token. The simplest way to do this is
to [generate a token manually](https://github.com/settings/tokens) and then run:

```
curl -u username:token https://api.github.com/user
```

Replace `username` and `token` as appropriate, and the rest should be the same
as the request where you logged in with a password. Note that this token really
is just as sensitive as your password - you don't want to share it in plaintext
or check it in to your git repository.


## Building an application using a REST API

REST APIs accept HTTP requests and return (usually) JSON - in principle you can
use the HTTP functionality built in to your language/framework and program the
API interactions "from scratch." This is a good exercise, but in practice most
well-supported APIs have official libraries that build the requests for you and
expose objects and methods so you can interact with them naturally in your code.

We will build our application using Express. The first step will be to register
a new OAuth token. [Do so from the GitHub webpage](https://github.com/settings/tokens) -
you should set it to have permission to create gists.

You will then see a page with a personal access token that will only ever
display once - copy it somewhere safe, and treat it as a password! That it,
don't paste it into your code to check in, don't send over chat/email, etc.
Instead, you should set it as an environment variable:

To use it, set the token in a `.env` file in the repository. The starter file has some
help with this task.  Open the file called `dotenv`, paste in your token as described in
the file, and resave the file with a new name of `.env`.  Be sure to not check in the 
`.env` file! It's already in `.gitignore` but could still end up explicitly added if you 
really try to push it.

Environment variables can also be declared in the terminal, such as the example below:

```
export GITHUB_TOKEN="yourtoken"
```


The token will be accessible within node as `process.env.GITHUB_TOKEN`, and can
be used to authenticate the GitHub client:

```
const GitHubApi = require('github');
const github = new GitHubApi({ debug: true });

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN
});
```

Inspect the client you get back, and you'll see that it supports a variety of
operations. Most of these return promises - this is because performing API
requests means asking for data from a machine you don't immediately control over
a network, and you can't depend on the timing (when it will return). Your code
needs to account for this, for example to get user information:

```
let handle = "k33g";
github.users.getForUser({username: handle}).then(response => {
    console.log(response.data);
});
```

The general pattern is `github.noun.verb()` - essentially every entity and
action possible on GitHub is accessible in this fashion, so you can explore and
use your imagination. You can retrieve stars, followers, repositories, or other
things on a user basis, and if you're authorized you can also take actions
(check stars on things, create repositories or gists, follow users, etc.). Read
the [documentation on the API provided by this package](https://octokit.github.io/node-github/)
for more details.

## Adding client-side encryption

We will be using [TweetNaCL](https://github.com/dchest/tweetnacl-js#usage). nacl
is a fairly simple cryptosystem - it makes good default decisions using modern
but well-tested algorithms. The included package.json also installs
tweetnacl-util, which provides utilities for encoding between strings and bytes.
You can load both in your code as follows:

```
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
```

Note that nacl prefers handling things as `Uint8Array` - that is, a bunch of
numbers. You'll want to take a look at the nacl.util functions to translate
between these and more user-friendly strings.

```
> nacl.util = require('tweetnacl-util');
{ decodeUTF8: [Function],
  encodeUTF8: [Function],
  encodeBase64: [Function],
  decodeBase64: [Function] }
```

Generally, the UTF8 functions are meant for the messages (UTF8 is a common
encoding for human readable text), and the Base64 functions are meant for keys
(you can encode the secret key to Base64 before giving it to the user to save
"offline", and then decode it back from Base64 when reinitializing their
keypair).

Getting this to work will require some experimentation - start `node` from the
command line, require the modules, and interact with them. In general, you'll
need `encodeUTF8 / decodeUTF8` functions to translate between human-readable
text (the gist content you care about) and the
[Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
that nacl works with natively. You'll also need the
`encodeBase64 / decodeBase64` functions to translate keys/nonces/ciphertext
into representations that can be returned as a string (but aren't intended to
be human readable).

### Symmetric crypto

Symmetric cryptography is done using `nacl.secretbox()`, and requires a single
secret key as well as a unique random nonce on each execution. The output blob
should be saved along with the nonce, which will then be used to decrypt it
later. The nonce should be 24 bytes long and the key should be 32 bytes (the
default values for nacl).

Both the key and nonce need to use good randomness - `nacl.randomBytes(length)`
will provide this. You will also want to give the secret key to the user so
they can save it ("offline" - assume they can keep it safe, like a passphrase)
and use it later to decrypt things. Since asking users to save an array of
numbers isn't great, use the utility functions to encode it for them. To read
it back, for now you can just set it as an environment variable similar to the
OAuth token.

Once you've encrypted the content of the gist, make sure to also include the
nonce, otherwise you won't be able to decrypt it. The nonce can just be
prepended to the encrypted content, and then the whole thing can be encoded and
returned/saved as appropriate.

To decrypt, reverse the process - pick off the nonce, decode both nonce and
encrypted content, decrypt the content with the nonce and the key, and return.

### Asymmetric crypto (optional)

The first thing you'll have to do is use `nacl.box.keyPair()` to generate a new
public/private keypair. To regenerate the same keypair later, you should let the
user retrieve their own private key (referred to as `secretKey` in nacl), and
then when they start the application again setup with
`nacl.box.keyPair.fromSecretKey(secretKey)`.

Once set up, nacl supports the standard range of asymmetric crypto operations -
sign, encrypt, verify, decrypt. The "box/unbox" methods combine sign/encrypt
and verify/decrypt, to make your life as a developer a bit easier. The main
difference you'll have to worry about is returning both the public and private
key to the user, and reinitializing the keypair from the private one.

At first box/unbox with the whole keypair, but you can add methods/routes to
support passing in the public keys of other users - this would let you encrypt
for them (so only they can decrypt), while signing with your private key (so
they can verify the message really came from you by using your public key).

### Going further

There is a stubbed `/login` route and some suggestive comments at bottom of
`app.js` - if you are interested, it's highly encouraged to take this app even
further. In general, this could grow into a secure pastebin, where users can
share notes and secrets with each other and not have to trust the host. This
exploration is beyond the scope of your initial work, but is good to think
about and absolutely worth exploring if you are so inclined.
