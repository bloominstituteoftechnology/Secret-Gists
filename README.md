# Secret Gists
Save and read secure notes using GitHub gists


## Audience and Purpose

Audience: Node.js developers, CS students, security enthusiasts

* Learn about OAuth
* Learn how to use an authenticated REST API
* Learn how to do simple client-side encryption/decryption using existing libraries


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

We will build our application using Express.


## Adding client-side encryption

We will be using [TweetNaCL](https://github.com/dchest/tweetnacl-js#usage).
