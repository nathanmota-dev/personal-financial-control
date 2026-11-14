import type { InvestmentWithdrawalOrigin } from "@/lib/db/schema/types";

/** Reserve and portfolio as the bank's positions stood right before a withdrawal. */
export type ReserveWithdrawalSplit = { reserveCents: number; portfolioCents: number };

/** The origins a person can pick for a withdrawal waiting for classification. */
export type ReserveWithdrawalChoice = Exclude<InvestmentWithdrawalOrigin, "pending">;

export type ClassifyReserveWithdrawalInput = { transactionId: string; origin: ReserveWithdrawalChoice };

/** A bank withdrawal the app could not attribute, because the reserve and the portfolio both had money. */
export type PendingReserveWithdrawal = {
  id: string;
  transactionDate: string;
  description: string;
  amountCents: number;
  accountName: string | null;
};

/** The withdrawal a bank import recorded, as the reserve rule reads it. */
export type TrackedWithdrawal = { id: string; amountCents: number; transactionDate: string };
