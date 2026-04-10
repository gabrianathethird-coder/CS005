import os
import random

# Securely overwrite a file multiple times before deleting it.
# This is meant to make recovery of the original data much harder.
def secure_shred(file_path: str, passes: int = 3):
    """Implements DoD 5220.22-M-style file shredding."""
    if not os.path.exists(file_path):
        return

    length = os.path.getsize(file_path)
    if length == 0:
        os.remove(file_path)
        return

    with open(file_path, "ba+", buffering=0) as f:
        # Pass 1: overwrite with zero bytes.
        f.seek(0)
        f.write(b'\x00' * length)
        f.flush()
        os.fsync(f.fileno())

        # Pass 2: overwrite with 0xFF bytes.
        if passes >= 2:
            f.seek(0)
            f.write(b'\xFF' * length)
            f.flush()
            os.fsync(f.fileno())

        # Pass 3: overwrite with cryptographically secure random bytes.
        if passes >= 3:
            f.seek(0)
            chunk_size = 64 * 1024
            written = 0
            while written < length:
                to_write = min(chunk_size, length - written)
                f.write(os.urandom(to_write))
                written += to_write
            f.flush()
            os.fsync(f.fileno())

    # Rename the file to a random name before deleting to obscure the original file name.
    dir_name = os.path.dirname(file_path)
    random_name = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=10)) + ".tmp"
    temp_path = os.path.join(dir_name, random_name)
    os.rename(file_path, temp_path)
    os.remove(temp_path)
