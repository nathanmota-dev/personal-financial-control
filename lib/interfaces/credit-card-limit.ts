import type { DashboardCardInvoice } from "@/lib/interfaces/dashboard-cards";

/** A card's limit as the bank last reported it, split by what occupies it. Amounts in cents. */
export type CreditCardLimitView = {
  limitCents: number;
  /** Negative when the card is above its limit. */
  availableCents: number;
  usedCents: number;
  /** Invoice still to be paid. Its total is part of what is used. */
  currentInvoiceMonth: string;
  currentInvoiceCents: number;
  /** Used beyond the current invoice: installments billed on later invoices. */
  committedCents: number;
  /** Day the bank reported the limit, `YYYY-MM-DD` in São Paulo. */
  collectedOn: string;
};

/** Limits by card account id. Cards without a limit reported by the bank are absent. */
export type CreditCardLimits = Record<string, CreditCardLimitView>;

export type CreditCardLimitInput = {
  limitCents: number;
  availableCents: number;
  collectedOn: string;
  invoice: DashboardCardInvoice;
};

export type CreditCardLimitSegmentKey = "invoice" | "committed" | "available";

export type CreditCardLimitSegment = {
  key: CreditCardLimitSegmentKey;
  label: string;
  hint: string;
  amountCents: number;
  /** Share of the limit, in percent. */
  percent: number;
  /** Width of the bar segment, 0–100. */
  width: number;
  /** Tailwind background class of the bar segment and legend dot. */
  colorClassName: string;
};

export type CreditCardLimitBarProps = { limit: CreditCardLimitView };
