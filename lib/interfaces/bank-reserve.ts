import type { InvestmentAssetClass } from "@/lib/db/schema/types";

/** Realized return of the bank-synced positions over a recent window, read from position snapshots. */
export type BankReserveYield = {
  /** Monthly rate, in basis points, normalized to 30 days. */
  monthlyRateBps: number;
  /** Days between the oldest snapshot used and the bank's latest value. */
  periodDays: number;
  /** What the reserve would earn in a month at that rate. */
  reserveMonthlyYieldCents: number;
};

/** One amount set by the user splits the synced positions: the reserve, and the portfolio with the rest. */
export type BankReserveSplit = {
  totalCents: number;
  /** `null` until the user sets it; the whole total is then portfolio. */
  configuredReserveCents: number | null;
  reserveCents: number;
  portfolioCents: number;
  /** The total fell below the amount set, so the reserve shows the total. */
  exceedsTotal: boolean;
  /** Latest date the bank reported for a linked position. */
  valueAsOf: string;
  realizedYield: BankReserveYield | null;
};

export type RealizedYieldHolding = { id: string };
export type RealizedYieldSnapshot = { holdingId: string; snapshotDate: string; currentValueCents: number };

export type RealizedYieldInput = {
  holdings: RealizedYieldHolding[];
  snapshots: RealizedYieldSnapshot[];
  asOfDate: string;
  windowDays?: number;
};

export type RealizedYieldResult = { monthlyRateBps: number; periodDays: number };

export type ClassAmount = { assetClass: InvestmentAssetClass; amountCents: number };

export type SetBankReserveInput = { reserveAmountCents: number };
