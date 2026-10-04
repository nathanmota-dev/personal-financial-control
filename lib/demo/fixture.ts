import type { DemoFixture } from "@/lib/demo/contracts";
import { accounts } from "./fixture-data/accounts";
import { categories } from "./fixture-data/categories";
import { creditCardCharges } from "./fixture-data/credit-card-charges";
import { creditCardInstallments } from "./fixture-data/credit-card-installments";
import { financialGoalAllocations } from "./fixture-data/financial-goal-allocations";
import { financialGoals } from "./fixture-data/financial-goals";
import { investmentHoldings } from "./fixture-data/investment-holdings";
import { investmentPortfolio } from "./fixture-data/investment-portfolio";
import { investmentPurposeAllocations } from "./fixture-data/investment-purpose-allocations";
import { investmentPurposes } from "./fixture-data/investment-purposes";
import { recurringTemplates } from "./fixture-data/recurring-templates";
import { transactions } from "./fixture-data/transactions";
import { transfers } from "./fixture-data/transfers";
export { accountIds,categoryIds,recurringIds } from "./fixture-data/support";

export const demoFixture: DemoFixture = {
  categories,
  accounts,
  recurringTemplates,
  transactions,
  transfers,
  creditCardCharges,
  creditCardInstallments,
  investmentPortfolio,
  investmentHoldings,
  investmentPurposes,
  investmentPurposeAllocations,
  financialGoals,
  financialGoalAllocations,
};
