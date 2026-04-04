# KeyNest - Local Offline File Vault
**Course:** CS 005 - Information Assurance and Security (Technological Institute of the Philippines)

KeyNest is a strictly offline, desktop-optimized web application for secure file encryption and decryption. Built to process files with zero cloud connectivity, it uses AES-256-GCM chunked encryption to safely handle large files with a low memory footprint. 

---

## 🛠 Tech Stack
- **Backend Framework:** Python + Flask
- **Frontend UI:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **Cryptography:** Python `cryptography` library (AES-256-GCM, PBKDF2HMAC)
- **Database:** SQLite3 (Audit Logging)
- **File Management:** `os`, `shutil`

---

## 📦 Project Architecture
The application is logically separated into a presentation layer (Flask Routes + HTML/JS) and a core security layer (`core/` modules).

```text
CS005-System-1-KeyNest-/
├── app.py                   # Main Flask application and REST API routes
├── requirements.txt         # Python dependencies
├── core/
│   ├── crypto.py            # AES-256-GCM & PBKDF2 Key Derivation Engine
│   ├── shredder.py          # DoD 5220.22-M Secure File Erasure
│   └── audit.py             # SQLite Audit Logger connector
├── static/
│   ├── css/style.css        # Glassmorphic UI styling
│   └── js/main.js           # AJAX Fetch logic for seamless UX
└── templates/
    ├── index.html           # Vault Dashboard (Encrypt / Decrypt)
    └── logs.html            # Audit Logs Viewer
```

---

## 🔒 Implemented Modules & Features

### 1. Key Derivation (PBKDF2HMAC)
When a user provides a password, KeyNest never uses it directly. Instead, it generates a random 16-byte cryptographic salt and passes the password through **PBKDF2HMAC (SHA-256)** for 100,000 iterations. This protects against brute-force and rainbow table attacks.

### 2. AES-256-GCM Engine
To encrypt files securely without consuming excess RAM:
- The system reads files iteratively in **64KB chunks**.
- It uses Authenticated Encryption with Associated Data (AEAD) via AES in Galois/Counter Mode (GCM).
- A 12-byte Initialization Vector (IV) is generated per file.
- A 16-byte MAC Tag is appended at the end of the file. Random ciphertext modification or incorrect passwords will cause a cryptographic failure, preventing tampering.

*Custom File Format Structure:*
`[SALT (16 bytes)] [IV (12 bytes)] [TAG (16 bytes)] [ENCRYPTED DATA...]`

### 3. Secure Shredder (DoD 5220.22-M)
When the user opts to shred the original file after encryption:
1. **Pass 1:** Overwrites the entire file size with Zeroes (`0x00`).
2. **Pass 2:** Overwrites with Ones (`0xFF`).
3. **Pass 3:** Overwrites with cryptographically secure random bytes.
4. **Obfuscation:** The file is renamed to a random string (e.g., `a7x9p3z.tmp`) to hide the original filename from the operating system's MFT (Master File Table).
5. Finally, the file is unlinked/deleted from disk.

### 4. Audit Logger
A local SQLite database (`keynest.db`) ensures an immutable record of system events. 
- Logs timestamps, filenames, actions (`ENCRYPT`, `DECRYPT`, `SHRED`), and status vectors.
- These logs are viewable directly from the KeyNest Audit UI without requiring raw DB queries.

### 5. Flask UI
A single-page application experience powered by Flask endpoints. Forms handle asynchronous file uploads without refreshing the page. The frontend translates `encrypt_file` API responses directly into browser downloads, ensuring decrypted files don't permanently sit on the system unhandled.

---

## 🚀 How to Run

Because this app strictly follows security delimitations (No Internet / Localhost routing only), it must be run locally.

**1. Create a Virtual Environment**
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

**2. Install Dependencies**
```bash
pip install -r requirements.txt
```

**3. Run the Application**
```bash
python app.py
```
> Navigate to **http://127.0.0.1:5000** in your browser.

---

## 🛑 Delimitations Respected
- **Strictly Offline:** The Flask server binds exclusively to localhost (`127.0.0.1`).
- **Zero-Knowledge:** No passwords or keys are saved anywhere. If a password is lost, the file is mathematically irrecoverable.
- **Desktop Optimization:** UI scales gracefully for PC browsers without unnecessary mobile bloatware.
