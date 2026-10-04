import { relations } from "drizzle-orm";
import { accounts,categories } from "./accounts";
import { creditCardCharges } from "./credit-card";
import { financialGoalAllocations,financialGoals } from "./goals";
import { investmentHoldings,investmentPurposes } from "./investment-assets";
import { fixedIncomeTerms,investmentOperations,investmentQuotes } from "./investment-operations";
import { investmentPurposeAllocations } from "./investment-reductions";
import { recurringTemplates,transactionFundingLinks,transactions,transfers } from "./transactions";

export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
  outgoingTransfers: many(transfers, { relationName: "outgoing_transfers" }),
  incomingTransfers: many(transfers, { relationName: "incoming_transfers" }),
  recurringTemplates: many(recurringTemplates),
  creditCardCharges: many(creditCardCharges),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  recurringTemplates: many(recurringTemplates),
  creditCardCharges: many(creditCardCharges),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  recurringTemplate: one(recurringTemplates, {
    fields: [transactions.recurringTemplateId],
    references: [recurringTemplates.id],
  }),
  goalAllocations: many(financialGoalAllocations),
  fundingLinkAsExpense: one(transactionFundingLinks, {
    relationName: "funding_expense_transaction",
    fields: [transactions.id],
    references: [transactionFundingLinks.expenseTransactionId],
  }),
  fundingLinkAsWithdrawal: one(transactionFundingLinks, {
    relationName: "funding_withdrawal_transaction",
    fields: [transactions.id],
    references: [transactionFundingLinks.withdrawalTransactionId],
  }),
}));

export const transactionFundingLinksRelations = relations(
  transactionFundingLinks,
  ({ one }) => ({
    expenseTransaction: one(transactions, {
      relationName: "funding_expense_transaction",
      fields: [transactionFundingLinks.expenseTransactionId],
      references: [transactions.id],
    }),
    withdrawalTransaction: one(transactions, {
      relationName: "funding_withdrawal_transaction",
      fields: [transactionFundingLinks.withdrawalTransactionId],
      references: [transactions.id],
    }),
  })
);

export const financialGoalsRelations = relations(financialGoals, ({ many }) => ({
  allocations: many(financialGoalAllocations),
}));

export const investmentHoldingsRelations = relations(investmentHoldings, ({ many, one }) => ({
  allocations: many(investmentPurposeAllocations),
  operations: many(investmentOperations),
  quotes: many(investmentQuotes),
  fixedIncomeTerms: one(fixedIncomeTerms),
}));

export const investmentOperationsRelations = relations(investmentOperations, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [investmentOperations.holdingId],
    references: [investmentHoldings.id],
  }),
}));

export const investmentQuotesRelations = relations(investmentQuotes, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [investmentQuotes.holdingId],
    references: [investmentHoldings.id],
  }),
}));

export const fixedIncomeTermsRelations = relations(fixedIncomeTerms, ({ one }) => ({
  holding: one(investmentHoldings, {
    fields: [fixedIncomeTerms.holdingId],
    references: [investmentHoldings.id],
  }),
}));

export const investmentPurposesRelations = relations(investmentPurposes, ({ many }) => ({
  allocations: many(investmentPurposeAllocations),
}));

export const investmentPurposeAllocationsRelations = relations(
  investmentPurposeAllocations,
  ({ one }) => ({
    holding: one(investmentHoldings, {
      fields: [investmentPurposeAllocations.holdingId],
      references: [investmentHoldings.id],
    }),
    purpose: one(investmentPurposes, {
      fields: [investmentPurposeAllocations.purposeId],
      references: [investmentPurposes.id],
    }),
  })
);
