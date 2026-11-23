#!/usr/bin/env node
/**
 * Non-destructive Prisma migration deployment hook for Vercel builds.
 * Applies pending migrations automatically via `prisma migrate deploy` when
 * VERCEL=1 (or RUN_DB_MIGRATIONS=1) and a cloud PostgreSQL URL is configured.
 * Never resets or deletes existing database data.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT_DIR, 'packages', 'database', 'prisma', 'schema.prisma');
const PRISMA_CLI_CANDIDATES = [
  path.join(ROOT_DIR, 'node_modules', 'prisma', 'build', 'index.js'),
  path.join(ROOT_DIR, 'packages', 'database', 'node_modules', 'prisma', 'build', 'index.js'),
];

const isVercel = process.env.VERCEL === '1';
const forceMigrate = process.env.RUN_DB_MIGRATIONS === '1';

const CANDIDATE_ENV_VARS = [
  'DIRECT_URL',
  'POSTGRES_URL_NON_POOLING',
  'GOJIFEM_POSTGRES_URL_NON_POOLING',
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'GOJIFEM_POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'GOJIFEM_POSTGRES_URL',
];

let selectedSource = null;
let selectedUrl = '';
for (const envName of CANDIDATE_ENV_VARS) {
  const val = (process.env[envName] || '').trim();
  if (val) {
    selectedSource = envName;
    selectedUrl = val;
    break;
  }
}

const isLocalhost = /^postgres(ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$|\?)/i.test(
  selectedUrl,
);

if (!isVercel && !forceMigrate) {
  console.log('[gojifem:migrate] Skipping deploy migrations outside Vercel build (set RUN_DB_MIGRATIONS=1 to run locally).');
  process.exit(0);
}

if (!selectedUrl) {
  console.warn(
    '[gojifem:migrate] WARNING: No PostgreSQL URL found in Vercel Environment Variables. Skipping `prisma migrate deploy`.',
  );
  process.exit(0);
}

if (isVercel && isLocalhost) {
  console.warn(
    `[gojifem:migrate] WARNING: ${selectedSource} points to localhost on Vercel. Replace it with a cloud PostgreSQL URL so migrations and auth can connect.`,
  );
  process.exit(0);
}

// Ensure TLS sslmode=require for remote cloud databases (Supabase/Neon) if absent
let migrationUrl = selectedUrl;
if (!isLocalhost) {
  try {
    const parsed = new URL(selectedUrl);
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    migrationUrl = parsed.toString();
  } catch {
    // Keep original string if non-standard URL format
  }
}

const prismaCli = PRISMA_CLI_CANDIDATES.find((candidate) => fs.existsSync(candidate));
if (!prismaCli) {
  console.error('[gojifem:migrate] Prisma CLI binary not found in node_modules.');
  process.exit(1);
}

console.log(`[gojifem:migrate] Using ${selectedSource} for non-destructive \`prisma migrate deploy\`...`);
execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy', `--schema=${SCHEMA_PATH}`], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: migrationUrl,
  },
});
console.log('[gojifem:migrate] Pending migrations verified/applied successfully.');
