/**
 * Cryptographic utilities for AES-256-GCM encryption and PBKDF2 key derivation
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Derive a 256-bit AES key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as a key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the AES key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypt a file using AES-256-GCM
 * Returns the encrypted data with IV prepended
 */
export async function encryptFile(
  file: File,
  key: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; originalName: string; originalSize: number }> {
  const fileBuffer = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileBuffer
  );

  // Prepend IV to encrypted data for storage
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return {
    encryptedData: combined.buffer,
    originalName: file.name,
    originalSize: file.size,
  };
}

/**
 * Decrypt a file using AES-256-GCM
 * Expects the IV to be prepended to the encrypted data
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  originalName: string
): Promise<File> {
  const encryptedArray = new Uint8Array(encryptedData);
  
  // Extract IV from the beginning
  const iv = encryptedArray.slice(0, IV_LENGTH);
  const ciphertext = encryptedArray.slice(IV_LENGTH);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    // Return as a File object
    return new File([decryptedBuffer], originalName);
  } catch (error) {
    throw new Error('Decryption failed - file may be corrupted or tampered with');
  }
}

/**
 * Simulate secure file shredding by overwriting data multiple times
 * In a browser context, this overwrites the ArrayBuffer in memory
 */
export function secureShred(data: ArrayBuffer, passes: number = 3): void {
  const view = new Uint8Array(data);
  
  for (let pass = 0; pass < passes; pass++) {
    // Overwrite with random data
    crypto.getRandomValues(view);
  }
  
  // Final pass with zeros
  view.fill(0);
}

/**
 * Convert salt to hex string for storage
 */
export function saltToHex(salt: Uint8Array): string {
  return Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string back to Uint8Array
 */
export function hexToSalt(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
