
export interface LoadCreditCardBillContextContext {
  db: import("@/lib/db").AppDb;
  account: { currentBalanceCents: number; metrics: { postedIncomeCents: number; postedExpenseCents: number; postedInvestmentContributionCents: number; postedInvestmentWithdrawalCents: number; outgoingTransferCents: number; incomingTransferCents: number; }; id: string; name: string; type: "checking" | "savings" | "cash" | "credit" | "investment"; initialBalanceCents: number; creditClosingDay: number | null; creditDueDay: number; isArchived: boolean; nameHash: string | null; createdAt: Date & string; updatedAt: Date & string; };
  normalizedMonth: string;
}
