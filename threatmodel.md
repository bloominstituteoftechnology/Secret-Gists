## Threat Model Assessment

Working on this app where users can rate books and create lists of favorite books and books to read we need to take into account the following:
1) What sort of information do we manage that may be tempting to an adversary?
2) What sort of adversaries would be interested in targeting us for said information?
---
#### _What sort of information do we manage that may be temping to an adversary?_
Our app will serve users from all backgrounds above the age of 13.  The most sensitive information our app accesses will undoubtedly be user information such as name, age, email, password.  Because our app will house ratings of books, it could also be targeted to unfairly manipulate the ratings to either boost or harm book sales or for other malicious purposes.  Personal accounts could also be targeted by persons known to the user for practical jokes or malicious reasons (changing ratings, changing lists, etc).

---
#### _What sort of adversaries would be interested in targeting us for said information?_
The personal information could be targeted to be sold or used for malicious purposes.  The book ratings could be manipulated for malicious purposes.  Both of these would be done by more sophisticated adversaries and would cause app wide chaos.  Breaches of personal accounts by persons known to the users would likely occur because of passwords either being too simple (and guessed) or accidently shared with the third party. This last type of breach would have a limited scope only affecting the one user.

---
#### _Closing_
These are the sorts of threats we need to keep in mind while building this app.