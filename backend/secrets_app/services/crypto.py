from cryptography.exceptions import InvalidTag
import os, base64, hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ITERATIONS = 310000

def encrypt_secret(plaintext: str, password: str):
    salt = os.urandom(32)
    nonce = os.urandom(12)

    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        ITERATIONS,
        dklen=32
    )

    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)

    return {
        "ciphertext": base64.b64encode(ciphertext).decode("utf-8"),
        "salt": base64.b64encode(salt).decode("utf-8"),
        "nonce": base64.b64encode(nonce).decode("utf-8"),
    }
    
def decrypt_secret(ciphertext_b64,salt_b64,nonce_b64,password):
    ciphertext = base64.b64decode(ciphertext_b64)
    salt = base64.b64decode(salt_b64)
    nonce = base64.b64decode(nonce_b64)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        ITERATIONS,
        dklen=32
    )
    aesgcm = AESGCM(key)
    try:
        plaintext_bytes = aesgcm.decrypt(nonce,ciphertext,None)
    except InvalidTag : 
        raise ValueError("Mauvais mot de passe")
    return plaintext_bytes.decode("utf-8")