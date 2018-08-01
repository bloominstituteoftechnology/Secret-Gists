For each user, identify the threat model and potential mitigation techniques that will reduce the threat.

---

Bob is a 58 year old independent CPA.  He primarily services medium-income individuals and local businesses in his town of 10,000.  Bob shares office space with two others, both also independent CPAs.  He describes his relationship with them as cordial, but not quite friendly.  They are in competition with one another after all.  

These days, Bob does most of his work by computer.  He regularly uses email, an online file sharing website, and desktop tax software in his work.  Although he has had to learn many new things as his work has changed, Bob has gained a reasonable understanding of the technology he uses.  The records for each of his clients are encrypted using a different password.  He also used different passwords for each online service.  These passwords are kept in a notebook, which Bob diligently keeps locked in his file cabinet when not in use.

Adversaries - Bob's colleagues in his office - they are competitors after all! Customers who could potentially steal other customer information. Janitorial Staff who snoop around and might be smart enough to plant an attack vector on a PC. Identity thieves in general. 


Attack surface - File cabinet where passwords are stored. email. tax software. online file sharing website.


Attack vectors - "customer" pretends to be a client while client is actually trying to talk to CPA via online chat. "customer" calls CPA to edit personal records (i.e. SSN, etc.). Janitorial staff break into file cabinet and steal notebook of passwords to gain access to customer/client list and SSN/birthday/other sensitive information. Colleagues plant a bug on machine to take over machine. A hostage type situation takes place when a criminal demands money in exhchange for unlocking customer records. etc. 


Risks (Confidentiality, Integrity, Availability, etc) -
all the above.

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - 
all sorts

Mitigation - password manager like LastPass that will generate random passwords for you and store them. Security cameras. Background checks on everyone you share an office with, janitorial staff included. Lock computer when not in use. Two factor authentication when logging into sensitive software. 

---

Yolanda, 17, is the most popular girl in her school.  Her Insta is perfectly curated, her Snaps are da bomb, and her Facebook account exists so she can talk to her grandma every other Sunday.  

She is on her phone constantly.  Typing in pin numbers or doing those silly patterns takes too much time, and she always has her phone in hand anyway, so what’s the point in locking it?  Yolanda also keeps all of her accounts logged in at all times so she can make sure she likes all of William’s posts before Jennifer gets to them.  

Yolanda gets along well with most of classmates, except Jennifer, but there are always haters who want to take people down.

Adversaries - Apparently Jennifer, who's a hater! Probably Grandma for only calline on Sundays. Mom...because all moms snoop. Teachers because they get in the way of being on the phone. Mean Girls cliques. 


Attack surface - obvs taking her phone. 


Attack vectors - Since phone is unlocked...delete accounts, delete email, impersonate Yolanda to other individuals. Call Grandma on Saturday to tell her that Yolanda will no longer be calling her on Sunday. If banking app....log in to banking app and mess with financials. Her Insta will have dog pics instead of cat pics -- #blasphemy -- and her snaps will no longer be as bomb diggity as they once were. 


Risks (Confidentiality, Integrity, Availability, etc) -
    Her integrity would probably change due to the person impersonating her. Her confidentiality really was never there. If she's always on the phone, and her phone is taken away, she will no longer be available. 

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - 
    MITM mainly. social. denial of service. 

Mitigation - fingerprint detection if available. instantiate a PIN to unlock phone. If iPhone X, Face ID. Password Manager on Phone (like LastPass) so she doesn't have to be loggged into ALL of her accounts all of the time. Just the ones she frequents the most. 

---

Zaida, 37, is a senior IT Security manager for the Washington, DC Embassy of a country whose relationship with the United States is, at best, complicated.  She oversees accounts, permissions, and access for the embassy’s personnel, including locally employed staff.  

Zaida is an expert in her field.  At work, she and her team follow the latest best practices in account and network security.  She keeps her work and home life private - using separate phones and computers for each.  He job is high stress, so she values her time off as a chance to relax and step away from the high-stakes world of her job, and enjoys not having to worry about someone hacking her devices or accounts.  

Adversaries - nationals of other heads of state, U.S. possibly included. Depends on the country really as to who an adversary might be. 


Attack surface - all sorts of large computers and servers at the embassy. Maybe personal phones and personal computers are not as well-protected and can be manipulated easier. 


Attack vectors - Ransomware for the large computers and servers at the embassy. Although this would probably be a case for an attack that has never been thought of before. 




Risks (Confidentiality, Integrity, Availability, etc) -
She has the most to lose out of everyone on this list. 

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - 


Mitigation - I would hope that the government has all the best people working on security for their computers systems. As for personal stuff, password managers and proper protections need to be sure to be taken. 

---

Rashad is a web developer for a small UI/UX firm.  He just had one of his projects hit the front pages of all the trendy design subreddits and blogs.  He’s very excited, but a little concerned that his twitter, instagram, and github handles are now being shared all over the internet.  

He currently uses different passphrases for all of his accounts, except that he shares the same password for all of his email accounts because he has them all set up to forward to a single account anyway.  

Rashad is himself an avid blogger.  He has a moderately popular, weekly column where he shares the weeks adventures, hangouts, vacations, etc.  He is excited that next week he will be heading out to his favorite vacation spot since childhood - Rehoboth Beach, DE.

Adversaries - Readers of his blog, users on Reddit, primarily folks who will be online


Attack surface - his blog, his projects


Attack vectors - script attack that injects malicious code - any attack online where someone would impersonate him, any attack online where a link could be turned into a link that goes to a malicious website, etc. 


Risks (Confidentiality, Integrity, Availability, etc) -
Medium Risk - not as high as the woman at the embassy but not as low as some of the others either because he's a little higher profiles at the moment. 

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - 
MITM, malware, social

Mitigation - sanitizing of inputs. 




