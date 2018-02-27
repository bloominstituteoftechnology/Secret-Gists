1. Threat model - security is a matter of context of what threats to security the engineer is facing, what the application is facing and of course what the user is facing. Having a good threat model is crucial for being able to idenitfy potential adversities and how to resolve them. This also includes identifying which services are vulnerable, how data is taken out push out.  e.g idenitity theft, phishing scams. 3 different threats for software engineers list below (not an exhaustive list)

2. Confidentiality - making sure your information is only being shown to parties you intend to show. All other parties should not have access to this information. e.g Hippa Act to ensure confidentiality of medical records

3. authenticity/integerty - having the information be recived to be given in a unaltered fashion. e.g Bank website is actual your bank rather than fake website posing as a bank website. 

4. availabiliy - services being up and working. Not losing the data. e.g Sites being hacked, DDOS, deleting data, ransomware denying availability to user (extortion)

5. Man in the middle attack - intercepting communications between two or more parties and listening in to the communication which violates confidentiality. They can also maliciouly change the data sent by one party undermining its authenticity and even availability

6. DDOS - attacking websites by overflooding requests to the servers. Can be either from one computer or using several compromised computers called botnet. The user might not even know they are one of the compromised computers and having several of them makes it harder for it to trace the attackers ip address. This is destributed denial of service. 

7. malware - how you end up joining a botnet in the first place often showing up in spam email. Developers can be attacked because they have access to a larger consumer base

8. injection - code injection where code has malicious accesss to memory outside of what it was allocated, code can end up in c program and executing. This is a injection type called buffer overflow. SQL injection is another example where extra SQL commands is inputed by user which can be executed by the developer unknowingly.  cross site scripting - grabbing cookies or user data by embedding javascript into application

9. PassPhrase - password implies one word while a phrase takes much longer time for computer to guess. 

10. Firewalls - monitoring requests, ports and services are allowing into the computer and which ones are blocked. 

11. isolation - using containers to isolate processes so they don't know about each other. If one processes is compromised, it doesn't affect other processes limiting the damage

12. content security policy - to specify what resources can be loaded on your webpages and reduce cross site scripting

13. encryption - provides integrity and confidentiality to data. The data should be encrypted both on rest when data is resting in database and in transit from one party to another. The result of encryption performed on plain text using a algorithm is cipher text.

14. defense in depth - protecting in many way you can to account for as much as you can to protect your data. 

15. exclusive or - refers to logic gate where one statement has to true and other has to be false or has to be 1 or 0 never both. Good cryptography comes down to good randoms. e.g if both parties agree to pad 'bar'. The cipher or encrypted bit is the xor operation. The pad 'bar' is necessary for the decryption to be sucessful so outside parties cannot read the data. 

16. keys - We often exhange keys. Ramdom generator and pseudo random generator take the smaller key number and expands it. The quality of randomness is key here. Both parties need to have the key which is secret. 

17. crytographic hash functions - take input and output digest (gobbly gook). It is a one way function where the output cannot be used to figure out the input. The other parties will know the hash function which is why the reciever will be able to verify the data authenticity.

18. symmetric key crytography  - is when both parties share the same key. Nonce is used to further encrupt data. 

19. assymetric key cryptography - when both parties have different private keys. You get a public and private key. Public key is shared with both parties. Data is sent with both the data and the right public key is required to absolves the data. 

20. public key infrastructure - certificate authorities (companies) keep secure keys and assign secure keys to the users and list of trusted keys. This depends on trust of the vender that provde certificate authorities. These authorities are highly valued targets.

21. web of trust - encryption software that can be guarenteed to be trusted with key signing parties. Users manage and generate their own key pairs and use their own keys to sign the keys of their friends. They can then verify that the key do come from that person. Keys are hashed and further encrypted with the private key. The reciever can then decrypt using the signers public key. This helps ensure vertification of indentity as well as data. Trust here is knowing that the key does belong to that person. Manage all of this themselves without help of certificate authorities and often really rare in practice.

22. block chains - create decentralized public transactions that isn't owned by a particular coporation or entity. 

Note - use estabished crytographic algorithms and code rather than using your own. OAuth login provide framework for creating a secure username and password management. Personal security is good practice with good turn on encryption, pass phrases and utilizing encryption. Utlize ssl to get the certificate authority on your website such as 'Let's Encrypt'. Json Web tokens for logging in. Having private and public keys or ssh keys. Two factor authentication such as a phone or email. Can also includes biometrics such as fingerprint or face recognition. Don't use same password for everything or password manager. Check signature before installing software.