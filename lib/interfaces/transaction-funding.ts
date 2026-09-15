export const transactionFundingSources = ["account", "investments"] as const;

export type TransactionFundingSource = (typeof transactionFundingSources)[number];

export const transactionFundingLinkTypes = ["investment_funded_expense"] as const;

export type TransactionFundingLinkType = (typeof transactionFundingLinkTypes)[number];

export type TransactionFundingLink = {
  id: string;
  expenseTransactionId: string;
  withdrawalTransactionId: string;
  type: TransactionFundingLinkType;
};
