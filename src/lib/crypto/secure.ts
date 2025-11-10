import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const KEY_BYTE_LENGTH = 32;
const IV_BYTE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

function decodeKey(source: string): Buffer {
  // Try base64
  try {
    const base64 = Buffer.from(source, 'base64');
    if (base64.length === KEY_BYTE_LENGTH) {
      return base64;
    }
  } catch {
    // ignore
  }

  // Try hex
  if (/^[\da-f]+$/i.test(source) && source.length === KEY_BYTE_LENGTH * 2) {
    return Buffer.from(source, 'hex');
  }

  // Fallback: treat as utf8
  const utf8 = Buffer.from(source, 'utf8');
  if (utf8.length === KEY_BYTE_LENGTH) {
    return utf8;
  }

  throw new Error('ENCRYPTION_KEY must resolve to 32 bytes (base64, hex or utf8).');
}

function getKey(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }

  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('Missing ENCRYPTION_KEY environment variable.');
  }

  cachedKey = decodeKey(secret);
  return cachedKey;
}

export function encrypt(plainText: string): string {
  if (!plainText) {
    throw new Error('Cannot encrypt empty payload.');
  }

  const key = getKey();
  const iv = randomBytes(IV_BYTE_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Compose iv + authTag + ciphertext
  const payload = Buffer.concat([iv, authTag, encrypted]);
  return payload.toString('base64');
}

export function decrypt(payload: string): string {
  if (!payload) {
    throw new Error('Cannot decrypt empty payload.');
  }

  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, IV_BYTE_LENGTH);
  const authTag = raw.subarray(IV_BYTE_LENGTH, IV_BYTE_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_BYTE_LENGTH + AUTH_TAG_LENGTH);

  const key = getKey();
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function encryptJson<T>(value: T): string {
  return encrypt(JSON.stringify(value));
}

export function decryptJson<T>(payload: string): T {
  const text = decrypt(payload);
  return JSON.parse(text) as T;
}
