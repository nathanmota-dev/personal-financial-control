import { beforeEach, vi } from "vitest";
import fixtures from "./fixtures/finance.json";
import { dashboardFixture } from "./fixtures/dashboard";
import * as accounts from "@/lib/server/accounts";
import * as categories from "@/lib/server/categories";
import * as transactions from "@/lib/server/transactions";
import * as transfers from "@/lib/server/transfers";
import * as recurring from "@/lib/server/recurring";
import * as dashboard from "@/lib/server/dashboard";
import * as creditCard from "@/lib/server/credit-card";
import * as investments from "@/lib/server/investments";
import * as goals from "@/lib/server/goals";
import * as operations from "@/lib/server/investment-operations";
import * as portfolio from "@/lib/server/investment-portfolio";
import * as projection from "@/lib/server/projected-balance";
import { requirePageSession } from "@/lib/auth/server";
import * as actions from "@/app/actions/finance";
vi.mock("embla-carousel-react", () => ({
  default: vi.fn(() => [vi.fn(), undefined]),
}));
vi.mock("@/lib/auth/server", () => ({ requirePageSession: vi.fn() }));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  connection: vi.fn(),
}));
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter" }),
}));
vi.mock("@/lib/server/accounts", () => ({ listAccounts: vi.fn() }));
vi.mock("@/lib/server/categories", () => ({ listCategories: vi.fn() }));
vi.mock("@/lib/server/transactions", () => ({ listTransactions: vi.fn() }));
vi.mock("@/lib/server/transfers", () => ({ listTransfers: vi.fn() }));
vi.mock("@/lib/server/recurring", () => ({ listRecurringTemplates: vi.fn() }));
vi.mock("@/lib/server/dashboard", () => ({
  getDashboardData: vi.fn(),
  getMonthlyDashboard: vi.fn(),
  getMonthlyEvolution: vi.fn(),
  getMonthlyExpenseFeed: vi.fn(),
  getCategorySpendingReport: vi.fn(),
}));
vi.mock("@/lib/server/credit-card", () => ({ getCreditCardOverview: vi.fn() }));
vi.mock("@/lib/server/investments", () => ({
  getInvestmentProjection: vi.fn(),
  getInvestmentContributionHistory: vi.fn(),
}));
vi.mock("@/lib/server/goals", () => ({ getGoalsDashboard: vi.fn() }));
vi.mock("@/lib/server/investment-operations", () => ({
  getInvestmentOverview: vi.fn(),
  getEmergencyReserveComposition: vi.fn(),
  listLongTermInvestmentPositions: vi.fn(),
  getInvestmentAssetDetails: vi.fn(),
}));
vi.mock("@/lib/server/investment-portfolio", () => ({
  getInvestmentPortfolioDashboard: vi.fn(),
}));
vi.mock("@/lib/server/projected-balance", async (original) => ({
  ...(await original<typeof import("@/lib/server/projected-balance")>()),
  getProjectedBalance: vi.fn(),
}));
vi.mock("@/app/actions/finance", () => ({
  createAccountAction: vi.fn(),
  updateAccountAction: vi.fn(),
  archiveAccountAction: vi.fn(),
  createCategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
  archiveCategoryAction: vi.fn(),
  deleteCategoryAction: vi.fn(),
  createTransactionAction: vi.fn(),
  updateTransactionAction: vi.fn(),
  deleteTransactionAction: vi.fn(),
  createTransferAction: vi.fn(),
  createCreditCardChargeAction: vi.fn(),
  updateCreditCardChargeAction: vi.fn(),
  deleteCreditCardChargeAction: vi.fn(),
  createRecurringTemplateAction: vi.fn(),
  updateRecurringTemplateAction: vi.fn(),
  pauseRecurringTemplateAction: vi.fn(),
  deleteRecurringTemplateAction: vi.fn(),
  generateRecurringTransactionsAction: vi.fn(),
  configureInvestmentPortfolioAction: vi.fn(),
  updateInvestmentSettingsAction: vi.fn(),
  reconcileInvestmentBalanceAction: vi.fn(),
  getInvestmentReductionSourcesAction: vi.fn(),
  applyInvestmentReductionAction: vi.fn(),
  createInvestmentContributionAction: vi.fn(),
  createInvestmentWithdrawalAction: vi.fn(),
  createInvestmentHoldingAction: vi.fn(),
  updateInvestmentHoldingAction: vi.fn(),
  archiveInvestmentHoldingAction: vi.fn(),
  createInvestmentPurposeAction: vi.fn(),
  updateInvestmentPurposeAction: vi.fn(),
  archiveInvestmentPurposeAction: vi.fn(),
  upsertInvestmentPurposeAllocationAction: vi.fn(),
  deleteInvestmentPurposeAllocationAction: vi.fn(),
  createOperationalInvestmentAssetAction: vi.fn(),
  createInvestmentOperationAction: vi.fn(),
  updateInvestmentOperationAction: vi.fn(),
  deleteInvestmentOperationAction: vi.fn(),
  registerManualInvestmentQuoteAction: vi.fn(),
  updateManualInvestmentBalanceAction: vi.fn(),
  updateFixedIncomeTermsAction: vi.fn(),
  refreshInvestmentQuotesAction: vi.fn(),
  updateOperationalInvestmentAssetAction: vi.fn(),
  archiveOperationalInvestmentAssetAction: vi.fn(),
}));
beforeEach(() => {
  vi.stubEnv("DEMO_MODE", "true");
  for (const action of Object.values(actions))
    vi.mocked(action)
      .mockReset()
      .mockResolvedValue({ ok: true, data: null } as never);
  vi.mocked(requirePageSession)
    .mockReset()
    .mockResolvedValue({ name: "Visitante demo", picture: null } as never);
  vi.mocked(accounts.listAccounts)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.accounts) as never);
  vi.mocked(categories.listCategories)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.categories) as never);
  vi.mocked(transactions.listTransactions)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.transactions) as never);
  vi.mocked(transfers.listTransfers)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.transfers) as never);
  vi.mocked(recurring.listRecurringTemplates)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.recurring) as never);
  vi.mocked(dashboard.getDashboardData).mockReset().mockResolvedValue(structuredClone(dashboardFixture));
  vi.mocked(dashboard.getMonthlyDashboard)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.dashboard) as never);
  vi.mocked(dashboard.getMonthlyEvolution)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.evolution) as never);
  vi.mocked(dashboard.getMonthlyExpenseFeed)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.expenses) as never);
  vi.mocked(dashboard.getCategorySpendingReport)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.spending) as never);
  vi.mocked(creditCard.getCreditCardOverview)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.creditCard) as never);
  vi.mocked(investments.getInvestmentProjection)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.projection) as never);
  vi.mocked(investments.getInvestmentContributionHistory)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.history) as never);
  vi.mocked(goals.getGoalsDashboard)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.goals) as never);
  vi.mocked(portfolio.getInvestmentPortfolioDashboard)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.portfolio) as never);
  vi.mocked(operations.getInvestmentOverview)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.overview) as never);
  vi.mocked(operations.getEmergencyReserveComposition)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.composition) as never);
  vi.mocked(operations.listLongTermInvestmentPositions)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.positions) as never);
  vi.mocked(projection.getProjectedBalance)
    .mockReset()
    .mockResolvedValue(structuredClone(fixtures.projectedBalance) as never);
  vi.mocked(operations.getInvestmentAssetDetails)
    .mockReset()
    .mockResolvedValue(null);
});
