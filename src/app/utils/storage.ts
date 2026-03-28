/**
 * IndexedDB utilities for storing encrypted files
 */

const DB_NAME = 'AegisVault';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted_files';

export interface EncryptedFile {
  id: string;
  originalName: string;
  encryptedData: ArrayBuffer;
  dateSecured: number;
  originalSize: number;
}

/**
 * Initialize the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Store an encrypted file in IndexedDB
 */
export async function storeEncryptedFile(file: EncryptedFile): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(file);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Retrieve all encrypted files from IndexedDB
 */
export async function getAllEncryptedFiles(): Promise<EncryptedFile[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get a specific encrypted file by ID
 */
export async function getEncryptedFile(id: string): Promise<EncryptedFile | undefined> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete an encrypted file from IndexedDB
 */
export async function deleteEncryptedFile(id: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Clear all encrypted files from the vault
 */
export async function clearAllEncryptedFiles(): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}
