import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.exceptions import InvalidTag

CHUNK_SIZE = 64 * 1024  # 64 KB

def derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
    )
    return kdf.derive(password.encode('utf-8'))

def encrypt_file(input_path: str, output_path: str, password: str):
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = derive_key(password, salt)
    
    cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    
    with open(input_path, 'rb') as f_in, open(output_path, 'wb') as f_out:
        # Write header placeholder
        f_out.write(salt)
        f_out.write(iv)
        f_out.write(b'\x00' * 16) # Placeholder for TAG
        
        while True:
            chunk = f_in.read(CHUNK_SIZE)
            if not chunk:
                break
            f_out.write(encryptor.update(chunk))
        
        f_out.write(encryptor.finalize())
        tag = encryptor.tag
        
        # Seek back and write actual tag
        f_out.seek(16 + 12)
        f_out.write(tag)

def decrypt_file(input_path: str, output_path: str, password: str) -> bool:
    with open(input_path, 'rb') as f_in:
        salt = f_in.read(16)
        iv = f_in.read(12)
        tag = f_in.read(16)
        
        if len(salt) < 16 or len(iv) < 12 or len(tag) < 16:
            raise ValueError("Invalid file format")
            
        key = derive_key(password, salt)
        cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag))
        decryptor = cipher.decryptor()
        
        temp_out = output_path + ".tmp"
        try:
            with open(temp_out, 'wb') as f_out:
                while True:
                    chunk = f_in.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    f_out.write(decryptor.update(chunk))
                f_out.write(decryptor.finalize())
        except InvalidTag:
            if os.path.exists(temp_out):
                os.remove(temp_out)
            return False # Decryption failed
        except Exception as e:
            if os.path.exists(temp_out):
                os.remove(temp_out)
            raise e
            
    # Success
    os.rename(temp_out, output_path)
    return True
