module.exports = () => `<html>
<header><title>Secret Gists!</title></header>
<body>
<h1>Secret Gists!</h1>
<div>This is an educational implementation.  Do not use for truly valuable information</div>
<h2>Supported operations:</h2>
<ul>
  <li><i><a href="/keyPairGen">Show Keypair</a></i>: generate a keypair from your secret key.  Share your public key for other users of this app to leave encrypted gists that only you can decode with your secret key.</li>
  <li><i><a href="/gists">GET /gists</a></i>: retrieve a list of gists for the authorized user (including private gists)</li>
  <li><i><a href="/key">GET /key</a></i>: return the secret key used for encryption of secret gists</li>
</ul>
<h3>Set your secret key to a specific key</h3>
<form action="/setkey:keyString" method="get">
  Key String: <input type="text" name="keyString"><br>
  <input type="submit" value="Submit">
</form>
<h3>Create an *unencrypted* gist</h3>
<form action="/create" method="post">
  Name: <input type="text" name="name"><br>
  Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
  <input type="submit" value="Submit">
</form>
<h3>Create an *encrypted* gist for yourself</h3>
<form action="/createsecret" method="post">
  Name: <input type="text" name="name"><br>
  Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
  <input type="submit" value="Submit">
</form>
<h3>Retrieve an *encrypted* gist you posted for yourself</h3>
<form action="/fetchmessagefromself:id" method="get">
  Gist ID: <input type="text" name="id"><br>
  <input type="submit" value="Submit">
</form>
<h3>Create an *encrypted* gist for a friend to decode</h3>
<form action="/postmessageforfriend" method="post">
  Name: <input type="text" name="name"><br>
  Friend's Public Key String: <input type="text" name="publicKeyString"><br>
  Content:<br><textarea name="content" cols="80" rows="10"></textarea><br>
  <input type="submit" value="Submit">
</form>
<h3>Retrieve an *encrypted* gist a friend has posted</h3>
<form action="/fetchmessagefromfriend:messageString" method="get">
  String From Friend: <input type="text" name="messageString"><br>
  <input type="submit" value="Submit">
</form>
</body>
</html>`;
