#!/usr/bin/env node
/**
 * Non-destructive database schema, connectivity, and end-to-end CRUD verifier.
 * Run once DATABASE_URL (or POSTGRES_PRISMA_URL) is configured:
 *   npm run db:verify
 */
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const EXPECTED_TABLES = [
  'users',
  'oauth_accounts',
  'password_reset_tokens',
  'email_verification_tokens',
  'contact_submissions',
  'roles',
  'user_roles',
  'customer_profiles',
  'addresses',
  'vendors',
  'vendor_memberships',
  'vendor_verifications',
  'vendor_settlement_accounts',
  'categories',
  'products',
  'product_variants',
  'product_media',
  'inventory_items',
  'serviceable_destinations',
  'carts',
  'cart_items',
  'orders',
  'vendor_orders',
  'order_items',
  'payments',
  'payment_events',
  'shipments',
  'ledger_accounts',
  'ledger_transactions',
  'ledger_entries',
  'payouts',
  'outbox_events',
  'audit_logs',
  'idempotency_keys',
];

const dbUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.GOJIFEM_POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.GOJIFEM_POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.GOJIFEM_POSTGRES_URL ||
  ''
).trim();

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not set. Export DATABASE_URL and re-run `npm run db:verify`.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

const suffix = `verify_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

async function main() {
  // 1. Connectivity
  await prisma.$queryRaw`SELECT 1`;
  console.log('PASS 1/5: PostgreSQL connection succeeded (SELECT 1)');

  // 2. Verify all tables exist
  const rows = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = current_schema()`,
  );
  const existingTables = new Set(rows.map((r) => r.tablename));
  const missing = EXPECTED_TABLES.filter((t) => !existingTables.has(t));
  assert.equal(
    missing.length,
    0,
    `Missing migrated PostgreSQL tables: ${missing.join(', ')}. Run \`npm run db:migrate:deploy\`.`,
  );
  console.log(`PASS 2/5: All ${EXPECTED_TABLES.length} schema tables exist in PostgreSQL`);

  // 3-5. Non-destructive end-to-end verification in a rolled-back interactive transaction
  await prisma
    .$transaction(async (tx) => {
      const customerRole = await tx.role.upsert({
        where: { code: 'CUSTOMER' },
        update: {},
        create: { code: 'CUSTOMER', name: 'Customer Buyer' },
      });

      const customer = await tx.user.create({
        data: {
          email: `${suffix}@gojifem.verify`,
          passwordHash: 'verified_hash_placeholder',
          customerProfile: {
            create: { firstName: 'Verify', lastName: 'Customer' },
          },
        },
        include: { customerProfile: true },
      });
      await tx.userRole.create({ data: { userId: customer.id, roleId: customerRole.id } });
      const fetchedCustomer = await tx.user.findUniqueOrThrow({
        where: { id: customer.id },
        include: { customerProfile: true, userRoles: true },
      });
      assert.equal(fetchedCustomer.email, `${suffix}@gojifem.verify`);
      console.log('PASS 3/5: Customer account creation, role linking, and retrieval verified');

      const vendor = await tx.vendor.create({
        data: {
          legalName: `Verify Merchant ${suffix}`,
          displayName: `Verify Store ${suffix}`,
          slug: `verify-store-${suffix}`,
          ownerUserId: customer.id,
        },
      });
      const category = await tx.category.create({
        data: { name: `Verify Cat ${suffix}`, slug: `verify-cat-${suffix}` },
      });
      const product = await tx.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: category.id,
          title: `Verify Product ${suffix}`,
          slug: `verify-prod-${suffix}`,
          description: 'Verification listing',
          status: 'ACTIVE',
          variants: {
            create: {
              sku: `SKU-${suffix}`,
              title: 'Standard',
              priceMinor: 500000n,
              inventory: { create: { onHand: 10 } },
            },
          },
        },
        include: { variants: true },
      });
      const variant = product.variants[0];
      console.log('PASS 4/5: Merchant, category, product, variant, and inventory operations verified');

      const cart = await tx.cart.create({
        data: {
          userId: customer.id,
          items: { create: { variantId: variant.id, quantity: 2 } },
        },
        include: { items: true },
      });
      assert.equal(cart.items.length, 1);

      const order = await tx.order.create({
        data: {
          orderNumber: `GOJI-VERIFY-${suffix}`,
          customerUserId: customer.id,
          billingCountryCode: 'NG',
          shippingAddressSnapshot: { city: 'Lagos', countryCode: 'NG' },
          subtotalMinor: 1000000n,
          shippingFeeMinor: 250000n,
          totalMinor: 1250000n,
          vendorOrders: {
            create: {
              vendorId: vendor.id,
              vendorOrderNumber: `GOJI-V-${suffix}`,
              subtotalMinor: 1000000n,
              shippingFeeMinor: 250000n,
              commissionBps: 1000,
              commissionAmountMinor: 100000n,
              vendorPayableMinor: 900000n,
              items: {
                create: {
                  variantId: variant.id,
                  sku: variant.sku,
                  title: product.title,
                  variantSnapshot: { title: variant.title },
                  unitPriceMinor: 500000n,
                  quantity: 2,
                  subtotalMinor: 1000000n,
                  commissionAmountMinor: 100000n,
                },
              },
            },
          },
          payments: {
            create: {
              paymentReference: `PSK_VERIFY_${suffix}`,
              provider: 'PAYSTACK',
              amountMinor: 1250000n,
            },
          },
        },
      });
      assert.ok(order.id);
      console.log('PASS 5/5: Shopping cart, split vendor order, order item, and payment persistence verified');

      throw new Error('ROLLBACK_VERIFICATION_TRANSACTION');
    })
    .catch((err) => {
      if (err?.message !== 'ROLLBACK_VERIFICATION_TRANSACTION') {
        throw err;
      }
    });

  console.log('ALL DATABASE VERIFICATION CHECKS PASSED (transaction rolled back cleanly; zero test data stored)');
}

main()
  .catch((err) => {
    console.error('DATABASE VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
