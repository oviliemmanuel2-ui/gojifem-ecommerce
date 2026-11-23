import crypto from 'node:crypto';
import { decryptBytes, encryptBytes } from './crypto';
import { logServerEvent } from './logger';

export const MAX_KYC_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const PRIVATE_KYC_BUCKET = 'merchant-kyc-documents';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

export interface ValidatedKycFile {
  safeFileName: string;
  normalizedMimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  fileSizeBytes: number;
  sha256Checksum: string;
  buffer: Buffer;
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function matchesMagicBytes(buf: Buffer, ext: string): 'application/pdf' | 'image/jpeg' | 'image/png' | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-') {
    if (ext !== '.pdf') return null;
    return 'application/pdf';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    if (ext !== '.jpg' && ext !== '.jpeg') return null;
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    if (ext !== '.png') return null;
    return 'image/png';
  }
  return null;
}

/**
 * Validates file size, extension, declared MIME type, and actual binary magic bytes.
 */
export function validateKycFile(
  originalName: string,
  declaredMimeType: string,
  buffer: Buffer,
): ValidatedKycFile {
  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty. Please choose a valid PDF, JPG, or PNG document.');
  }
  if (buffer.length > MAX_KYC_FILE_BYTES) {
    throw new Error('File exceeds the 10 MB maximum size limit.');
  }

  const ext = getFileExtension(originalName);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Unsupported file extension. Only PDF, JPG, JPEG, and PNG documents are allowed.');
  }

  const lowerMime = (declaredMimeType || '').toLowerCase().trim();
  if (lowerMime && !ALLOWED_MIME_TYPES.has(lowerMime)) {
    throw new Error('Unsupported file content type. Only PDF, JPG, JPEG, and PNG documents are allowed.');
  }

  const detectedMime = matchesMagicBytes(buffer, ext);
  if (!detectedMime) {
    throw new Error(
      'File signature does not match an authentic PDF, JPEG, or PNG document. Please upload an uncorrupted file.',
    );
  }

  const sanitizedBase = originalName
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);

  return {
    safeFileName: sanitizedBase || `document${ext}`,
    normalizedMimeType: detectedMime,
    fileSizeBytes: buffer.length,
    sha256Checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
    buffer,
  };
}

function getSupabaseStorageConfig(): { url: string; serviceKey: string } | null {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.GOJIFEM_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_GOJIFEM_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');

  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GOJIFEM_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.GOJIFEM_SUPABASE_SECRET_KEY ||
    ''
  ).trim();

  if (!url || !serviceKey) return null;
  return { url, serviceKey };
}

function encodeObjectPath(storageKey: string): string {
  return storageKey
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

async function ensurePrivateBucketExists(url: string, serviceKey: string): Promise<void> {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: PRIVATE_KYC_BUCKET,
      name: PRIVATE_KYC_BUCKET,
      public: false,
      file_size_limit: MAX_KYC_FILE_BYTES,
      allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png'],
    }),
  });

  if (res.ok || res.status === 409) return;
  const text = await res.text().catch(() => '');
  if (/already exists/i.test(text)) return;
  throw new Error(`Supabase private bucket check failed (${res.status}): ${text}`);
}

export interface StoredKycObjectResult {
  storageProvider: 'SUPABASE_PRIVATE' | 'ENCRYPTED_VAULT';
  storageBucket: string | null;
  storageKey: string;
  encryptedPayload: Buffer | null;
}

/**
 * Uploads validated KYC document bytes to private Supabase Storage (never public).
 * Falls back to AES-256-GCM encrypted database vault when Storage keys are unavailable.
 */
export async function uploadPrivateKycObject(
  storageKey: string,
  buffer: Buffer,
  mimeType: string,
): Promise<StoredKycObjectResult> {
  const sb = getSupabaseStorageConfig();
  if (sb) {
    try {
      await ensurePrivateBucketExists(sb.url, sb.serviceKey);
      const uploadRes = await fetch(
        `${sb.url}/storage/v1/object/${PRIVATE_KYC_BUCKET}/${encodeObjectPath(storageKey)}`,
        {
          method: 'POST',
          headers: {
            apikey: sb.serviceKey,
            Authorization: `Bearer ${sb.serviceKey}`,
            'Content-Type': mimeType,
            'x-upsert': 'false',
          },
          body: new Uint8Array(buffer),
        },
      );

      if (uploadRes.ok) {
        return {
          storageProvider: 'SUPABASE_PRIVATE',
          storageBucket: PRIVATE_KYC_BUCKET,
          storageKey,
          encryptedPayload: null,
        };
      }
      const errText = await uploadRes.text().catch(() => '');
      logServerEvent('warn', 'kycStorage', 'Supabase Storage private upload failed; falling back to encrypted DB vault', {
        status: uploadRes.status,
        detail: errText.slice(0, 200),
      });
    } catch (err: unknown) {
      logServerEvent('warn', 'kycStorage', 'Supabase Storage unavailable; using encrypted DB vault fallback', {
        errorMessage: err instanceof Error ? err.message : 'Unknown storage error',
      });
    }
  }

  return {
    storageProvider: 'ENCRYPTED_VAULT',
    storageBucket: null,
    storageKey,
    encryptedPayload: encryptBytes(buffer),
  };
}

/**
 * Streams/retrieves private KYC bytes exclusively for authorized server endpoints.
 */
export async function downloadPrivateKycObject(doc: {
  storageProvider: string;
  storageBucket: string | null;
  storageKey: string;
  encryptedPayload: Buffer | Uint8Array | null;
}): Promise<Buffer> {
  if (doc.storageProvider === 'SUPABASE_PRIVATE' && doc.storageBucket) {
    const sb = getSupabaseStorageConfig();
    if (!sb) {
      throw new Error('Private document storage credentials are not configured.');
    }
    const res = await fetch(
      `${sb.url}/storage/v1/object/authenticated/${encodeURIComponent(doc.storageBucket)}/${encodeObjectPath(doc.storageKey)}`,
      {
        method: 'GET',
        headers: {
          apikey: sb.serviceKey,
          Authorization: `Bearer ${sb.serviceKey}`,
        },
        cache: 'no-store',
      },
    );
    if (!res.ok) {
      throw new Error(`Unable to fetch private document from secure vault (status ${res.status}).`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  if (!doc.encryptedPayload) {
    throw new Error('Encrypted document payload missing.');
  }
  return decryptBytes(doc.encryptedPayload);
}

/**
 * Removes an object from private Supabase Storage when a merchant replaces or removes a draft file.
 */
export async function deletePrivateKycObject(doc: {
  storageProvider: string;
  storageBucket: string | null;
  storageKey: string;
}): Promise<void> {
  if (doc.storageProvider !== 'SUPABASE_PRIVATE' || !doc.storageBucket) return;
  const sb = getSupabaseStorageConfig();
  if (!sb) return;

  try {
    await fetch(
      `${sb.url}/storage/v1/object/${encodeURIComponent(doc.storageBucket)}/${encodeObjectPath(doc.storageKey)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: sb.serviceKey,
          Authorization: `Bearer ${sb.serviceKey}`,
        },
      },
    );
  } catch {
    // Non-fatal cleanup miss
  }
}
