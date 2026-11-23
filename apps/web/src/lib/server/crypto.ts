import crypto from 'node:crypto';

function getEncryptionKey(): Buffer {
  const rawSecret =
    process.env.MERCHANT_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.JWT_ACCESS_SECRET ||
    process.env.GOJIFEM_SUPABASE_JWT_SECRET ||
    'gojifem_dev_fallback_encryption_secret_32chars';
  return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Encrypts sensitive plaintext strings (TIN, full NUBAN/IBAN) using AES-256-GCM.
 */
export function encryptSensitive(plaintext: string): string {
  const value = plaintext.trim();
  if (!value) return '';
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts strings encrypted with `encryptSensitive`.
 */
export function decryptSensitive(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null;
  if (!ciphertext.startsWith('v1:')) return ciphertext;
  const parts = ciphertext.split(':');
  if (parts.length !== 4) return null;
  try {
    const [, ivB64, tagB64, dataB64] = parts;
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Encrypts binary KYC document payloads using AES-256-GCM when stored in database fallback vault.
 */
export function encryptBytes(payload: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from('V1', 'ascii'), iv, tag, encrypted]);
}

/**
 * Decrypts binary KYC document payloads stored via `encryptBytes`.
 */
export function decryptBytes(blob: Buffer | Uint8Array): Buffer {
  const buf = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
  if (buf.length < 30 || buf.subarray(0, 2).toString('ascii') !== 'V1') {
    throw new Error('Corrupt or unsupported encrypted document payload.');
  }
  const iv = buf.subarray(2, 14);
  const tag = buf.subarray(14, 30);
  const data = buf.subarray(30);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export function maskAccountNumber(accountNumber: string): string {
  const clean = accountNumber.replace(/\s+/g, '');
  if (clean.length <= 4) return '****';
  return `${'*'.repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
}

export function maskTin(tin: string): string {
  const clean = tin.trim();
  if (clean.length <= 4) return '****';
  return `${'*'.repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
}
