For each user, identify the threat model and potential mitigation techniques that will reduce the threat.

Bob is a 58 year old independent CPA. He primarily services medium-income individuals and local businesses in his town of 10,000. Bob shares office space with two others, both also independent CPAs. He describes his relationship with them as cordial, but not quite friendly. They are in competition with one another after all.

These days, Bob does most of his work by computer. He regularly uses email, an online file sharing website, and desktop tax software in his work. Although he has had to learn many new things as his work has changed, Bob has gained a reasonable understanding of the technology he uses. The records for each of his clients are encrypted using a different password. He also used different passwords for each online service. These passwords are kept in a notebook, which Bob diligently keeps locked in his file cabinet when not in use.

Adversaries - two other independent CPAs

Attack surface - physical computer, email, file sharing website

Attack vectors - find passwords in locked file cabinet -> log in to computer, log in to email and delete, log in to file sharing website and delete, open tax software and delete data

Risks (Confidentiality, Integrity, Availability, etc) - C: person's tax info in tax software, I: reputation in his town as CPA, A: can't do taxes if client private data is being leaked, people won't ask him to do their taxes and there will probably be legal implications for leaked client info.

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - physical

Mitigation - multiple / tougher lock system for physical password notebook, biometric systems / use encryped password manager instead of physical

Yolanda, 17, is the most popular girl in her school. Her Insta is perfectly curated, her Snaps are da bomb, and her Facebook account exists so she can talk to her grandma every other Sunday.

She is on her phone constantly. Typing in pin numbers or doing those silly patterns takes too much time, and she always has her phone in hand anyway, so what’s the point in locking it? Yolanda also keeps all of her accounts logged in at all times so she can make sure she likes all of William’s posts before Jennifer gets to them.

Yolanda gets along well with most of classmates, except Jennifer, but there are always haters who want to take people down.

Adversaries - other girls (or students in general) who would want to defame Yolanda (such as Jennifer and/or her friends)

Attack surface - phone

Attack vectors - phone

Risks (Confidentiality, Integrity, Availability, etc) - C: private dms, photos, texts, I: pretend to be Yolanda and embarass self, A: prevent access to phone

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - take physical phone, phising

Mitigation - use passlock / biometrics on phone, be weary of phising, security warnings about logins from unregistered devices

Zaida, 37, is a senior IT Security manager for the Washington, DC Embassy of a country whose relationship with the United States is, at best, complicated. She oversees accounts, permissions, and access for the embassy’s personnel, including locally employed staff.

Zaida is an expert in her field. At work, she and her team follow the latest best practices in account and network security. She keeps her work and home life private - using separate phones and computers for each. He job is high stress, so she values her time off as a chance to relax and step away from the high-stakes world of her job, and enjoys not having to worry about someone hacking her devices or accounts.

Adversaries - enemies of her state, possibly the US

Attack surface - phone, laptop

Attack vectors - phone, laptop, wifi/ethernet

Risks (Confidentiality, Integrity, Availability, etc) - C: divulgence of state / embassy accounts, permission settings, access to embassy personnel, I: accounts, permission settings, A: denial of good comms / relations done via embassies

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - Man-in-the-middle, DDOS, backdoors, phising, keyloggers

Mitigation - no wifi for protected devices, robust / comprehensive AV/firewall, need-to-know basis for embassy personnel

Rashad is a web developer for a small UI/UX firm. He just had one of his projects hit the front pages of all the trendy design subreddits and blogs. He’s very excited, but a little concerned that his twitter, instagram, and github handles are now being shared all over the internet.

He currently uses different passphrases for all of his accounts, except that he shares the same password for all of his email accounts because he has them all set up to forward to a single account anyway.

Rashad is himself an avid blogger. He has a moderately popular, weekly column where he shares the weeks adventures, hangouts, vacations, etc. He is excited that next week he will be heading out to his favorite vacation spot since childhood - Rehoboth Beach, DE.

Adversaries - other UI/UX firms, people who are bitter at how "moderately popoular" he is as a blogger, tr0115

Attack surface - work computer, work network, social handles, blog

Attack vectors - work computer, work network, social media, blog

Risks (Confidentiality, Integrity, Availability, etc) - P: reputation harm from social media/blog, company trade secrets, I: integrity of work products, A: work product, blog

Types of Attacks (Man-in-the-middle, (Distributed) denial of service, Backdoors/malware, social, etc.) - malware/cryptomining injection/keylogger/phising in work product, DDOS of work website, social media password recovery via email (just find email password and forward to hacker email instead)

Mitigation - use different passwords / redunancies in login requests for all emails, work AV/firewall/IT security, less specifics on social media/blog (i.e. location)
