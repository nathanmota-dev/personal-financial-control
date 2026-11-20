export type SpendingEntryType = "income" | "expense" | "investment_contribution" | "investment_withdrawal";

/** One movement as the reports count it: an active transaction, or a card installment in its invoice month. */
export type SpendingEntry = {
  id: string;
  source: "transaction" | "card_installment";
  month: string;
  date: string;
  description: string;
  amountCents: number;
  type: SpendingEntryType;
  status: string;
  accountId: string | null;
  accountName: string | null;
  categoryId: string | null;
  categoryName: string;
  categoryGroup: string | null;
  isUncategorized: boolean;
};

export type SpendingTotals = {
  incomeCents: number;
  expenseCents: number;
  fixedExpenseCents: number;
  variableExpenseCents: number;
  uncategorizedExpenseCents: number;
  investmentContributionCents: number;
  investmentWithdrawalCents: number;
  entryCount: number;
};

export type SpendingCategoryTotal = {
  categoryId: string | null;
  categoryName: string;
  categoryGroup: string | null;
  type: SpendingEntryType;
  amountCents: number;
  entryCount: number;
};

export type SpendingSummary = {
  fromMonth: string;
  toMonth: string;
  totals: SpendingTotals;
  byCategory: SpendingCategoryTotal[];
  byMonth: { month: string; incomeCents: number; expenseCents: number }[];
  /** Present only when requested, largest first. */
  entries?: SpendingEntry[];
  entriesTruncated?: boolean;
};
