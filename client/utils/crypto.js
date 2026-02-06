/**
 * Client-side E2E encryption module
 *
 * Architecture:
 *   - Master Key: 256-bit AES key generated on first sign-up
 *   - Master Key is encrypted with a Key Encryption Key (KEK) derived from the user's password/recovery key
 *   - Notes are encrypted with the Master Key using AES-256-GCM
 *   - Recovery Key: 24-word mnemonic-style key that can decrypt the Master Key
 *   - The server NEVER sees the plaintext Master Key or any plaintext note content
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for GCM
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 600000; // OWASP 2024 recommendation

// --- Utility functions ---

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateIv() {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// --- Recovery Key Generation ---

// Generates a 256-bit recovery key displayed as 8 groups of 4 hex chars
export function generateRecoveryKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  // Format as 8 groups of 8 hex chars for readability: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const groups = [];
  for (let i = 0; i < hex.length; i += 8) {
    groups.push(hex.slice(i, i + 8));
  }
  return groups.join('-');
}

// --- Key Derivation ---

async function deriveKeyFromRecovery(recoveryKey, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(recoveryKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// --- Master Key Operations ---

export async function generateMasterKey() {
  return crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable so we can wrap it
    ['encrypt', 'decrypt']
  );
}

export async function exportMasterKey(masterKey) {
  const raw = await crypto.subtle.exportKey('raw', masterKey);
  return bufferToBase64(raw);
}

export async function importMasterKey(base64Key) {
  const raw = base64ToBuffer(base64Key);
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt the master key with a KEK derived from the recovery key
export async function encryptMasterKey(masterKey, recoveryKey) {
  const salt = generateSalt();
  const iv = generateIv();
  const kek = await deriveKeyFromRecovery(recoveryKey, salt);
  const rawMasterKey = await crypto.subtle.exportKey('raw', masterKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    kek,
    rawMasterKey
  );

  return {
    encryptedMasterKey: bufferToBase64(encrypted),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  };
}

// Decrypt the master key using the recovery key
export async function decryptMasterKey(encryptedData, recoveryKey) {
  const salt = base64ToBuffer(encryptedData.salt);
  const iv = base64ToBuffer(encryptedData.iv);
  const encryptedKey = base64ToBuffer(encryptedData.encryptedMasterKey);
  const kek = await deriveKeyFromRecovery(recoveryKey, new Uint8Array(salt));

  const rawMasterKey = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(iv) },
    kek,
    encryptedKey
  );

  return crypto.subtle.importKey(
    'raw',
    rawMasterKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

// Hash recovery key for server-side verification (never sends the actual key)
export async function hashRecoveryKey(recoveryKey) {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(recoveryKey));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Note Encryption/Decryption ---

export async function encryptText(plaintext, masterKey) {
  const encoder = new TextEncoder();
  const iv = generateIv();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    masterKey,
    encoder.encode(plaintext)
  );

  return {
    encrypted: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
  };
}

export async function decryptText(encryptedBase64, ivBase64, masterKey) {
  const decoder = new TextDecoder();
  const encrypted = base64ToBuffer(encryptedBase64);
  const iv = base64ToBuffer(ivBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(iv) },
    masterKey,
    encrypted
  );

  return decoder.decode(decrypted);
}

// Convenience: encrypt a note (title + content)
export async function encryptNote(title, content, masterKey) {
  const [titleResult, contentResult] = await Promise.all([
    encryptText(title, masterKey),
    encryptText(content, masterKey),
  ]);

  return {
    titleEncrypted: titleResult.encrypted,
    titleIv: titleResult.iv,
    contentEncrypted: contentResult.encrypted,
    contentIv: contentResult.iv,
  };
}

// Convenience: decrypt a note
export async function decryptNote(encryptedNote, masterKey) {
  const [title, content] = await Promise.all([
    decryptText(encryptedNote.titleEncrypted, encryptedNote.titleIv, masterKey),
    encryptedNote.contentEncrypted
      ? decryptText(encryptedNote.contentEncrypted, encryptedNote.contentIv, masterKey)
      : Promise.resolve(''),
  ]);

  return { title, content };
}
