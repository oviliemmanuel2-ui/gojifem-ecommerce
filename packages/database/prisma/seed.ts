import { PrismaClient, LedgerAccountType, UserAccountStatus, VendorStatus, VerificationStatus, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding GOJIFEM Database ---');

  // 1. Roles
  const roles = [
    { code: 'ADMIN', name: 'Platform Administrator', description: 'Full administrative access' },
    { code: 'FINANCE', name: 'Finance Officer', description: 'Reconciliation, payouts, and ledger auditing' },
    { code: 'MODERATOR', name: 'Catalog Moderator', description: 'Vendor and product listing review' },
    { code: 'SUPPORT', name: 'Customer Support', description: 'Issue handling and customer assistance' },
    { code: 'VENDOR_OWNER', name: 'Vendor Owner', description: 'Primary owner of a merchant store' },
    { code: 'VENDOR_STAFF', name: 'Vendor Staff', description: 'Order packing and inventory management' },
    { code: 'CUSTOMER', name: 'Customer', description: 'Marketplace buyer' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: role,
    });
  }
  console.log('✓ Roles seeded');

  // 2. Serviceable Destinations (Decoupled Shipping Gate)
  const destinations = [
    {
      countryCode: 'NG',
      countryName: 'Nigeria',
      isEnabled: true,
      supportedCarriers: ['GIGL', 'Kwik Delivery', 'DHL Express Nigeria', 'Red Star Express'],
      estimatedDaysMin: 1,
      estimatedDaysMax: 4,
      notes: 'All 36 states and Federal Capital Territory covered with tracked dispatch.',
    },
    {
      countryCode: 'GH',
      countryName: 'Ghana',
      isEnabled: true,
      supportedCarriers: ['DHL Express', 'FedEx'],
      estimatedDaysMin: 3,
      estimatedDaysMax: 6,
      notes: 'Accra, Kumasi and regional hubs.',
    },
    {
      countryCode: 'GB',
      countryName: 'United Kingdom',
      isEnabled: true,
      supportedCarriers: ['DHL Express International'],
      estimatedDaysMin: 4,
      estimatedDaysMax: 7,
      notes: 'Direct courier corridor for Nigerian diaspora items.',
    },
    {
      countryCode: 'US',
      countryName: 'United States',
      isEnabled: true,
      supportedCarriers: ['DHL Express', 'FedEx International'],
      estimatedDaysMin: 5,
      estimatedDaysMax: 8,
      notes: 'Select metropolitan delivery zones.',
    },
  ];

  for (const dest of destinations) {
    await prisma.serviceableDestination.upsert({
      where: { countryCode: dest.countryCode },
      update: dest,
      create: dest,
    });
  }
  console.log('✓ Serviceable destinations seeded');

  // 3. Marketplace Categories
  const categories = [
    { name: 'Fashion & Apparel', slug: 'fashion-apparel', iconUrl: '👗', sortOrder: 1 },
    { name: 'Electronics & Gadgets', slug: 'electronics-gadgets', iconUrl: '📱', sortOrder: 2 },
    { name: 'Beauty & Wellness', slug: 'beauty-wellness', iconUrl: '✨', sortOrder: 3 },
    { name: 'Home & Kitchen', slug: 'home-kitchen', iconUrl: '🏡', sortOrder: 4 },
    { name: 'Nigerian Groceries & Foods', slug: 'nigerian-groceries', iconUrl: '🍲', sortOrder: 5 },
    { name: 'Arts & Handcrafts', slug: 'arts-handcrafts', iconUrl: '🎨', sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log('✓ Categories seeded');

  // 4. Double-Entry Chart of Accounts
  const ledgerAccounts = [
    { code: '1010-PAYSTACK-CLEARING', name: 'Paystack Settlement Clearing', type: LedgerAccountType.PROVIDER_CLEARING },
    { code: '1020-FLUTTERWAVE-CLEARING', name: 'Flutterwave Settlement Clearing', type: LedgerAccountType.PROVIDER_CLEARING },
    { code: '2010-CUSTOMER-COLLECTIONS', name: 'Customer In-Transit Collections', type: LedgerAccountType.CUSTOMER_COLLECTIONS },
    { code: '3010-PLATFORM-COMMISSION', name: 'GOJIFEM Commission Revenue', type: LedgerAccountType.PLATFORM_COMMISSION },
    { code: '2020-VENDOR-PAYABLE', name: 'Vendor Payable Escrow', type: LedgerAccountType.VENDOR_PAYABLE },
    { code: '2030-DELIVERY-PAYABLE', name: 'Logistics Carrier Payable', type: LedgerAccountType.DELIVERY_PAYABLE },
    { code: '2040-REFUND-LIABILITY', name: 'Customer Refund Liability', type: LedgerAccountType.REFUND_LIABILITY },
    { code: '2050-PAYOUT-CLEARING', name: 'Vendor Bank Payout Clearing', type: LedgerAccountType.PAYOUT_CLEARING },
    { code: '5010-PROVIDER-FEES', name: 'Payment Gateway Processing Fees', type: LedgerAccountType.PROVIDER_FEES },
  ];

  for (const acc of ledgerAccounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: acc.code },
      update: acc,
      create: { ...acc, currency: 'NGN', balanceMinor: 0n },
    });
  }
  console.log('✓ Double-entry ledger accounts seeded');

  // 5. Seed Core Platform Users
  const passwordHash = '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash_for_testing';

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gojifem.com' },
    update: {},
    create: {
      email: 'admin@gojifem.com',
      phone: '+2348000000001',
      passwordHash,
      accountStatus: UserAccountStatus.ACTIVE,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  if (adminRole) {
    const existingAdminRole = await prisma.userRole.findFirst({
      where: {
        userId: adminUser.id,
        roleId: adminRole.id,
        vendorId: null,
      },
    });
    if (!existingAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });
    }
  }

  // 6. Seed Sample Verified Vendor
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@omoodua.com' },
    update: {},
    create: {
      email: 'vendor@omoodua.com',
      phone: '+2348023456789',
      passwordHash,
      accountStatus: UserAccountStatus.ACTIVE,
    },
  });

  const sampleVendor = await prisma.vendor.upsert({
    where: { slug: 'omo-odua-heritage' },
    update: {},
    create: {
      legalName: 'Omo Odua Heritage Looms Ltd',
      displayName: 'Omo Odua Heritage Looms',
      slug: 'omo-odua-heritage',
      ownerUserId: vendorUser.id,
      status: VendorStatus.APPROVED,
      commissionRateBps: 1000, // 10%
      description: 'Master weavers of authentic traditional Yoruba Aso-Oke attire based in Ibadan.',
    },
  });

  // Vendor KYC Verification record
  const existingVerification = await prisma.vendorVerification.findFirst({
    where: { vendorId: sampleVendor.id },
  });
  if (!existingVerification) {
    await prisma.vendorVerification.create({
      data: {
        vendorId: sampleVendor.id,
        evidenceType: 'CAC_CERTIFICATE',
        documentUrl: 'https://storage.gojifem.com/kyc/cac_rc123456.pdf',
        status: VerificationStatus.APPROVED,
        reviewerUserId: adminUser.id,
        reviewNotes: 'CAC registration and Tax ID verified against corporate registry.',
        verifiedAt: new Date(),
      },
    });
  }

  // Vendor Settlement Bank Account
  const existingSettlement = await prisma.vendorSettlementAccount.findFirst({
    where: { vendorId: sampleVendor.id },
  });
  if (!existingSettlement) {
    await prisma.vendorSettlementAccount.create({
      data: {
        vendorId: sampleVendor.id,
        bankCode: '058', // GTBank
        bankName: 'Guaranty Trust Bank',
        accountNumberMasked: '******7890',
        accountName: 'OMO ODUA HERITAGE LOOMS LTD',
        recipientCode: 'RCP_test_12345',
        isDefault: true,
        isVerified: true,
      },
    });
  }

  // 7. Seed Sample Product
  const fashionCategory = await prisma.category.findUnique({ where: { slug: 'fashion-apparel' } });
  if (fashionCategory) {
    const product = await prisma.product.upsert({
      where: { slug: 'authentic-aso-oke-traditional-attire' },
      update: {},
      create: {
        vendorId: sampleVendor.id,
        categoryId: fashionCategory.id,
        title: 'Handcrafted Luxury Aso-Oke Agbada & Fila Set',
        slug: 'authentic-aso-oke-traditional-attire',
        description: 'Woven from the finest threads by master artisans in Western Nigeria.',
        status: ProductStatus.ACTIVE,
      },
    });

    // Variant
    const variant = await prisma.productVariant.upsert({
      where: { sku: 'ASO-OKE-L-BLUE' },
      update: {},
      create: {
        productId: product.id,
        sku: 'ASO-OKE-L-BLUE',
        title: 'Large (Chest 44-46") - Royal Blue',
        priceMinor: 14500000n, // ₦145,000 in kobo
        currency: 'NGN',
        compareAtPriceMinor: 18000000n,
      },
    });

    // Inventory
    await prisma.inventoryItem.upsert({
      where: { variantId: variant.id },
      update: {},
      create: {
        variantId: variant.id,
        onHand: 14,
        reserved: 0,
        safetyStock: 2,
      },
    });
  }

  console.log('✓ Sample vendor, verification, settlement, and product seeded');
  console.log('--- GOJIFEM Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
