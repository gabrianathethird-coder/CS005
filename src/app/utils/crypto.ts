import { chacha20 } from '@noble/ciphers/chacha.js';
import { utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js';

/**
 * Derives a 32-byte key from a password using SHA-256
 */
async function deriveKey(password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Generates a random 12-byte nonce for ChaCha20
 */
function generateNonce(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encrypts text using ChaCha20
 * Returns the nonce concatenated with the ciphertext
 */
export async function encryptText(plaintext: string, password: string): Promise<Uint8Array> {
  const key = await deriveKey(password);
  const nonce = generateNonce();
  const plaintextBytes = utf8ToBytes(plaintext);
  
  const ciphertext = chacha20(key, nonce, plaintextBytes);
  
  // Concatenate nonce + ciphertext
  const result = new Uint8Array(nonce.length + ciphertext.length);
  result.set(nonce, 0);
  result.set(ciphertext, nonce.length);
  
  return result;
}

/**
 * Decrypts ChaCha20 encrypted data
 * Expects nonce to be the first 12 bytes
 */
export async function decryptText(encryptedData: Uint8Array, password: string): Promise<string> {
  if (encryptedData.length < 12) {
    throw new Error('Invalid encrypted data: too short');
  }
  
  const key = await deriveKey(password);
  const nonce = encryptedData.slice(0, 12);
  const ciphertext = encryptedData.slice(12);
  
  const plaintextBytes = chacha20(key, nonce, ciphertext);
  
  return bytesToUtf8(plaintextBytes);
}

/**
 * Calculates SHA-256 hash of data and returns as hex string
 */
export async function calculateHash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts a Blob to Uint8Array
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}