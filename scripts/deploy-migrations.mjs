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

const directUrl = (
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  ''
).trim();

const isLocalhost = /^postgres(ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$|\?)/i.test(
  directUrl,
);

if (!isVercel && !forceMigrate) {
  console.log('[gojifem:migrate] Skipping deploy migrations outside Vercel build (set RUN_DB_MIGRATIONS=1 to run locally).');
  process.exit(0);
}

if (!directUrl) {
  console.warn(
    '[gojifem:migrate] WARNING: No DATABASE_URL / POSTGRES_PRISMA_URL configured in Vercel Environment Variables. Skipping `prisma migrate deploy`.',
  );
  process.exit(0);
}

if (isVercel && isLocalhost) {
  console.warn(
    '[gojifem:migrate] WARNING: DATABASE_URL points to localhost on Vercel. Replace it with a cloud PostgreSQL URL so migrations and auth can connect.',
  );
  process.exit(0);
}

const prismaCli = PRISMA_CLI_CANDIDATES.find((candidate) => fs.existsSync(candidate));
if (!prismaCli) {
  console.error('[gojifem:migrate] Prisma CLI binary not found in node_modules.');
  process.exit(1);
}

console.log('[gojifem:migrate] Running non-destructive `prisma migrate deploy`...');
execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy', `--schema=${SCHEMA_PATH}`], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: directUrl,
  },
});
console.log('[gojifem:migrate] Pending migrations verified/applied successfully.');
