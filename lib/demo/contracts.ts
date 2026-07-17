import type {
  accounts,
  categories,
  creditCardCharges,
  creditCardInstallments,
  financialGoalAllocations,
  financialGoals,
  investmentPortfolio,
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
  investmentPortfolio: Array<typeof investmentPortfolio.$inferInsert>;
  financialGoals: Array<typeof financialGoals.$inferInsert>;
  financialGoalAllocations: Array<typeof financialGoalAllocations.$inferInsert>;
};
