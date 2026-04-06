import os
import random

def secure_shred(file_path: str, passes: int = 3):
    """
    Implements DoD 5220.22-M style file shredding.
    Pass 1: 0x00
    Pass 2: 0xFF
    Pass 3: Random bytes (os.urandom)
    """
    if not os.path.exists(file_path):
        return
        
    length = os.path.getsize(file_path)
    if length == 0:
        os.remove(file_path)
        return
        
    with open(file_path, "ba+", buffering=0) as f:
        # Pass 1: 0x00
        f.seek(0)
        f.write(b'\x00' * length)
        f.flush()
        os.fsync(f.fileno())
        
        # Pass 2: 0xFF
        if passes >= 2:
            f.seek(0)
            f.write(b'\xFF' * length)
            f.flush()
            os.fsync(f.fileno())
            
        # Pass 3: Random
        if passes >= 3:
            # Writing in chunks to avoid memory issues with large files
            f.seek(0)
            chunk_size = 64 * 1024
            written = 0
            while written < length:
                to_write = min(chunk_size, length - written)
                f.write(os.urandom(to_write))
                written += to_write
            f.flush()
            os.fsync(f.fileno())
            
    # Rename file before deletion to abstract original filename from FAT/NTFS logs
    dir_name = os.path.dirname(file_path)
    random_name = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=10)) + ".tmp"
    temp_path = os.path.join(dir_name, random_name)
    os.rename(file_path, temp_path)
    os.remove(temp_path)
