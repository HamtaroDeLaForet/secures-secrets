import os, base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.fernet import Fernet, InvalidToken

_ITERATIONS = 310_000

def _derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=_ITERATIONS)
    return base64.urlsafe_b64encode(kdf.derive(password.encode("utf-8")))

def encrypt_secret(plaintext: str, password: str):
    salt = os.urandom(16)
    key = _derive_key(password, salt)
    token = Fernet(key).encrypt(plaintext.encode("utf-8"))
    return token.decode("utf-8"), base64.b64encode(salt).decode("utf-8")

def decrypt_secret(ciphertext: str, password: str, salt_b64: str) -> str:
    salt = base64.b64decode(salt_b64.encode("utf-8"))
    key = _derive_key(password, salt)
    try:
        return Fernet(key).decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        raise PermissionError("Bad password")
