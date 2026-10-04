import { relations } from "drizzle-orm";
import { accounts,categories } from "./accounts";
import { creditCardBillPayments,creditCardBills,creditCardCharges,creditCardInstallments } from "./credit-card";
import { financialGoalAllocations,financialGoals } from "./goals";
import { investmentHoldings,investmentPurposes } from "./investment-assets";
import { investmentPurposeAllocations,investmentReductionEvents,investmentReductionSources } from "./investment-reductions";
import { recurringTemplates,transactions,transfers } from "./transactions";

export const investmentReductionEventsRelations = relations(
  investmentReductionEvents,
  ({ one, many }) => ({
    transaction: one(transactions, {
      fields: [investmentReductionEvents.transactionId],
      references: [transactions.id],
    }),
    sources: many(investmentReductionSources),
  })
);

export const investmentReductionSourcesRelations = relations(
  investmentReductionSources,
  ({ one }) => ({
    event: one(investmentReductionEvents, {
      fields: [investmentReductionSources.eventId],
      references: [investmentReductionEvents.id],
    }),
    holding: one(investmentHoldings, {
      fields: [investmentReductionSources.holdingId],
      references: [investmentHoldings.id],
    }),
    purpose: one(investmentPurposes, {
      fields: [investmentReductionSources.purposeId],
      references: [investmentPurposes.id],
    }),
    allocation: one(investmentPurposeAllocations, {
      fields: [investmentReductionSources.allocationId],
      references: [investmentPurposeAllocations.id],
    }),
  })
);

export const financialGoalAllocationsRelations = relations(
  financialGoalAllocations,
  ({ one }) => ({
    goal: one(financialGoals, {
      fields: [financialGoalAllocations.goalId],
      references: [financialGoals.id],
    }),
    transaction: one(transactions, {
      fields: [financialGoalAllocations.transactionId],
      references: [transactions.id],
    }),
  })
);

export const transfersRelations = relations(transfers, ({ one }) => ({
  fromAccount: one(accounts, {
    relationName: "outgoing_transfers",
    fields: [transfers.fromAccountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    relationName: "incoming_transfers",
    fields: [transfers.toAccountId],
    references: [accounts.id],
  }),
}));

export const recurringTemplatesRelations = relations(
  recurringTemplates,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [recurringTemplates.accountId],
      references: [accounts.id],
    }),
    category: one(categories, {
      fields: [recurringTemplates.categoryId],
      references: [categories.id],
    }),
    transactions: many(transactions),
  })
);

export const creditCardChargesRelations = relations(creditCardCharges, ({ one, many }) => ({
  account: one(accounts, {
    fields: [creditCardCharges.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [creditCardCharges.categoryId],
    references: [categories.id],
  }),
  installments: many(creditCardInstallments),
}));

export const creditCardBillsRelations = relations(creditCardBills, ({ one, many }) => ({
  account: one(accounts, {
    fields: [creditCardBills.accountId],
    references: [accounts.id],
  }),
  payments: many(creditCardBillPayments),
}));

export const creditCardBillPaymentsRelations = relations(
  creditCardBillPayments,
  ({ one }) => ({
    bill: one(creditCardBills, {
      fields: [creditCardBillPayments.billId],
      references: [creditCardBills.id],
    }),
    transaction: one(transactions, {
      fields: [creditCardBillPayments.transactionId],
      references: [transactions.id],
    }),
  })
);

export const creditCardInstallmentsRelations = relations(
  creditCardInstallments,
  ({ one }) => ({
    charge: one(creditCardCharges, {
      fields: [creditCardInstallments.chargeId],
      references: [creditCardCharges.id],
    }),
  })
);
