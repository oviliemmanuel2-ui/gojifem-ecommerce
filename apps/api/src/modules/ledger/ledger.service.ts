import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma, LedgerAccountType, LedgerEntryDirection } from '@gojifem/database';

@Injectable()
export class LedgerService {
  /**
   * Records a balanced double-entry transaction when an order is paid.
   * Debits: Provider Clearing (Paystack/Flutterwave)
   * Credits: Vendor Payable (Escrow for vendors), Platform Commission Revenue, Logistics Payable
   */
  async recordOrderPayment(params: {
    orderId: string;
    orderNumber: string;
    providerCode: string; // '1010-PAYSTACK-CLEARING' or '1020-FLUTTERWAVE-CLEARING'
    grossAmountMinor: bigint;
    vendorPayablesMinor: bigint;
    commissionMinor: bigint;
    deliveryMinor: bigint;
    currency?: string;
  }) {
    const {
      orderNumber,
      providerCode,
      grossAmountMinor,
      vendorPayablesMinor,
      commissionMinor,
      deliveryMinor,
      currency = 'NGN',
    } = params;

    // Verify balance: Debits must exactly equal Credits
    const totalCredits = vendorPayablesMinor + commissionMinor + deliveryMinor;
    if (grossAmountMinor !== totalCredits) {
      throw new BadRequestException(
        `Ledger out of balance: Gross (${grossAmountMinor}) != Credits (${totalCredits})`,
      );
    }

    const reference = `TX-PAY-${orderNumber}`;

    // Check idempotency: if transaction already recorded, skip
    const existing = await prisma.ledgerTransaction.findUnique({
      where: { reference },
    });
    if (existing) {
      return existing;
    }

    return prisma.$transaction(async (tx) => {
      // Fetch account IDs
      const [providerAcc, vendorAcc, commAcc, deliveryAcc] = await Promise.all([
        tx.ledgerAccount.findUnique({ where: { code: providerCode } }),
        tx.ledgerAccount.findUnique({ where: { code: '2020-VENDOR-PAYABLE' } }),
        tx.ledgerAccount.findUnique({ where: { code: '3010-PLATFORM-COMMISSION' } }),
        tx.ledgerAccount.findUnique({ where: { code: '2030-DELIVERY-PAYABLE' } }),
      ]);

      if (!providerAcc || !vendorAcc || !commAcc || !deliveryAcc) {
        throw new BadRequestException('Required chart of accounts missing in ledger');
      }

      const transaction = await tx.ledgerTransaction.create({
        data: {
          reference,
          description: `Order payment received for ${orderNumber}`,
          entries: {
            create: [
              // 1. DEBIT: Provider Clearing
              {
                accountId: providerAcc.id,
                direction: LedgerEntryDirection.DEBIT,
                amountMinor: grossAmountMinor,
                currency,
              },
              // 2. CREDIT: Vendor Payable Escrow
              {
                accountId: vendorAcc.id,
                direction: LedgerEntryDirection.CREDIT,
                amountMinor: vendorPayablesMinor,
                currency,
              },
              // 3. CREDIT: Platform Commission
              {
                accountId: commAcc.id,
                direction: LedgerEntryDirection.CREDIT,
                amountMinor: commissionMinor,
                currency,
              },
              // 4. CREDIT: Delivery Fee Payable
              {
                accountId: deliveryAcc.id,
                direction: LedgerEntryDirection.CREDIT,
                amountMinor: deliveryMinor,
                currency,
              },
            ],
          },
        },
        include: { entries: true },
      });

      // Update account balances
      await tx.ledgerAccount.update({
        where: { id: providerAcc.id },
        data: { balanceMinor: { increment: grossAmountMinor } },
      });
      await tx.ledgerAccount.update({
        where: { id: vendorAcc.id },
        data: { balanceMinor: { increment: vendorPayablesMinor } },
      });
      await tx.ledgerAccount.update({
        where: { id: commAcc.id },
        data: { balanceMinor: { increment: commissionMinor } },
      });
      await tx.ledgerAccount.update({
        where: { id: deliveryAcc.id },
        data: { balanceMinor: { increment: deliveryMinor } },
      });

      return transaction;
    });
  }

  async getAccountBalances() {
    return prisma.ledgerAccount.findMany({
      orderBy: { code: 'asc' },
    });
  }
}
