#!/usr/bin/env python
# -*- coding: utf-8 -*-

import pickle  # Potentially useful for converting things to/from strings
from fractions import gcd
from random import SystemRandom, randint

# Math utility methods
def is_probably_prime(n, tests=5):
    """
    Determine if a given number is likely to be prime.
    Based on: https://rosettacode.org/wiki/Miller–Rabin_primality_test#Python
    """
    if n < 2: return False
    for p in [2,3,5,7,11,13,17,19,23,29]:
        if n % p == 0: return n == p
    s, d = 0, n - 1
    while d % 2 == 0:
        s, d = s + 1, d // 2
    for i in range(tests):
        x = pow(randint(2, n - 1), d, n)
        if x == 1 or x == n-1: continue
        for r in range(1, s):
            x = (x * x) % n
            if x == 1: return False
            if x == n-1: break
        else: return False
    return True

def modpow(x, n, m):
    if n == 0:
        return 1
    elif n == 1:
        return x
    elif n % 2 == 0:
        return modpow(x * (x % m), n // 2, m) % m
    elif n % 2 == 1:
        return (x *  modpow(x * (x % m), (n - 1) // 2, m) % m) % m

def egcd(a, b):
    if a == 0:
        return (b, 0, 1)
    else:
        g, y, x = egcd(b % a, a)
        return (g, x - (b // a) * y, y)

def modinv(a, m):
    g, x, y = egcd(a, m)
    if g != 1:
        raise Exception('modular inverse does not exist')
    else:
        return x % m


class Rsa:
    """
    Simple implementation of RSA.
    Based on: http://pajhome.org.uk/crypt/rsa/implementation.html
    """
    def __init__(self, bitlen):
        self.rand = SystemRandom()  # This uses system randomness suitable for crypto
        self.bitlen = bitlen
        # Draw two random hopefully-primes in the range [0, 2^bits - 1]
        p = self._generate_large_random_prime()
        q = self._generate_large_random_prime()
        self.n = p * q
        m = (p - 1) * (q - 1)
        # Public key exponent
        self.e = 3
        while gcd(m, self.e) > 1:
            self.e += 2
        # Secret key exponent
        self.d = modinv(self.e, m)

    def _generate_large_random_prime(self):
        generated = False
        while not generated:
            candidate = self.rand.randint(0, 2**self.bitlen - 1)
            generated = is_probably_prime(candidate)
        return candidate

    def encrypt_int(self, num):
        return modpow(num, self.e, self.n)

    def decrypt_int(self, num):
        return modpow(num, self.d, self.n)

    def encrypt_string(self, plaintext):
        nums = [ord(c) for c in plaintext]
        enc_bits = [self.encrypt_int(n) for n in nums]
        return pickle.dumps(enc_bits)

    def decrypt_string(self, ciphertext):
        enc_bits = pickle.loads(ciphertext)
        chars = [chr(self.decrypt_int(n)) for n in enc_bits]
        plaintext = ''.join(chars)
        return plaintext

    def encrypt_for_other(self, plaintext, other_e, other_n):
        nums = [ord(c) for c in plaintext]
        enc_bits = [modpow(num, other_e, other_n) for num in nums]
        return pickle.dumps(enc_bits)


def test():
    rsa = Rsa(64)
    num = randint(0, 10000)
    print(num)
    enc = rsa.encrypt_int(num)
    print(enc)
    dec = rsa.decrypt_int(enc)
    print(num == dec)
