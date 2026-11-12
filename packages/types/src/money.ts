import { CurrencyCode } from './enums.js';

export interface Money {
  /**
   * Amount in minor units (e.g., Kobo for NGN, Cents for USD).
   * Stored as an integer (never floating point).
   */
  amount: bigint | number;
  currency: CurrencyCode;
}

export function toMinorUnits(majorAmount: number, currency: CurrencyCode): bigint {
  // All supported currencies (NGN, USD, GBP, EUR) use 2 decimal places (100 minor units = 1 major unit)
  return BigInt(Math.round(majorAmount * 100));
}

export function toMajorUnits(minorAmount: bigint | number, currency: CurrencyCode): number {
  const numeric = typeof minorAmount === 'bigint' ? Number(minorAmount) : minorAmount;
  return numeric / 100;
}

export function formatMoney(money: Money, locale: string = 'en-NG'): string {
  const major = toMajorUnits(money.amount, money.currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);
}
