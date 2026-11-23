#!/usr/bin/env node
/**
 * Safe operator utility to grant the ADMIN role to an existing GOJIFEM user.
 * Usage:
 *   DATABASE_URL="..." npm run admin:promote -- admin@gojifem.com
 */
import { PrismaClient } from '@prisma/client';

const email = (process.argv[2] || '').toLowerCase().trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:promote -- <registered-user-email>');
  process.exit(1);
}

const dbUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.GOJIFEM_POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.GOJIFEM_POSTGRES_URL_NON_POOLING ||
  ''
).trim();

if (!dbUrl) {
  console.error('DATABASE_URL (or GOJIFEM_POSTGRES_PRISMA_URL) is required.');
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}. Register the user first.`);
    process.exit(1);
  }

  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: 'Platform Administrator' },
  });

  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: adminRole.id, vendorId: null },
  });

  if (!existing) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id },
    });
  }

  console.log(`ADMIN role granted to ${user.email} (userId=${user.id}). Re-login to refresh JWT claims.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
