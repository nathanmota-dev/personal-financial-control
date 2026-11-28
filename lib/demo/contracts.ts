import type {
accounts,
categories,
creditCardCharges,
creditCardInstallments,
creditCardLimits,
financialGoalAllocations,
financialGoals,
investmentHoldings,
investmentPortfolio,
investmentPositionSnapshots,
investmentPurposeAllocations,
investmentPurposes,
monthlyBudgets,
recurringTemplates,
transactions,
transfers,
} from "@/lib/db/schema";

export type DemoFixture = {
  accounts: Array<typeof accounts.$inferInsert>;
  categories: Array<typeof categories.$inferInsert>;
  recurringTemplates: Array<typeof recurringTemplates.$inferInsert>;
  transactions: Array<typeof transactions.$inferInsert>;
  transfers: Array<typeof transfers.$inferInsert>;
  creditCardCharges: Array<typeof creditCardCharges.$inferInsert>;
  creditCardInstallments: Array<typeof creditCardInstallments.$inferInsert>;
  creditCardLimits: Array<typeof creditCardLimits.$inferInsert>;
  investmentPortfolio: Array<typeof investmentPortfolio.$inferInsert>;
  investmentHoldings: Array<typeof investmentHoldings.$inferInsert>;
  investmentPositionSnapshots: Array<typeof investmentPositionSnapshots.$inferInsert>;
  investmentPurposes: Array<typeof investmentPurposes.$inferInsert>;
  investmentPurposeAllocations: Array<typeof investmentPurposeAllocations.$inferInsert>;
  financialGoals: Array<typeof financialGoals.$inferInsert>;
  financialGoalAllocations: Array<typeof financialGoalAllocations.$inferInsert>;
  monthlyBudgets: Array<typeof monthlyBudgets.$inferInsert>;
};
