import { mkdir, writeFile } from "node:fs/promises";
import { listAccounts } from "@/lib/server/accounts";
import { listCategories } from "@/lib/server/categories";
import { listTransactions } from "@/lib/server/transactions";
import { listTransfers } from "@/lib/server/transfers";
import { listRecurringTemplates } from "@/lib/server/recurring";
import {
  getMonthlyDashboard,
  getMonthlyEvolution,
  getMonthlyExpenseFeed,
  getCategorySpendingReport,
} from "@/lib/server/dashboard";
import { getCreditCardOverview } from "@/lib/server/credit-card";
import { getGoalsDashboard } from "@/lib/server/goals";
import { getInvestmentPortfolioDashboard } from "@/lib/server/investment-portfolio";
import {
  getInvestmentContributionHistory,
  getInvestmentProjection,
} from "@/lib/server/investments";
import {
  getInvestmentOverview,
  getEmergencyReserveComposition,
  listLongTermInvestmentPositions,
  createOperationalInvestmentAsset,
  createInvestmentOperation,
  registerManualInvestmentQuote,
  updateManualInvestmentBalance,
  getInvestmentAssetDetails,
} from "@/lib/server/investment-operations";
import {
  getProjectedBalance,
  parseProjectedBalanceSearchParams,
} from "@/lib/server/projected-balance";

async function generate() {
  process.env.DEMO_MODE = "true";
  const stock = await createOperationalInvestmentAsset({
    name: "Ação para testes",
    type: "stock",
    ticker: "TEST3",
    assetClass: "equities",
    instrumentType: "stock",
    valuationMode: "market_quote",
  });
  await createInvestmentOperation({
    holdingId: stock.id,
    type: "buy",
    quantity: "10",
    unitPriceCents: 2000,
    operatedOn: "2026-07-01",
    notes: "Compra inicial",
  });
  await registerManualInvestmentQuote({
    holdingId: stock.id,
    quotedOn: "2026-07-16",
    unitPriceCents: 2200,
  });
  const fixed = await createOperationalInvestmentAsset({
    name: "CDB para testes",
    type: "cdb",
    assetClass: "fixed_income",
    instrumentType: "cdb",
    valuationMode: "manual_balance",
  });
  await createInvestmentOperation({
    holdingId: fixed.id,
    type: "application",
    grossAmountCents: 10000,
    operatedOn: "2026-07-01",
  });
  await updateManualInvestmentBalance({
    holdingId: fixed.id,
    currentValueCents: 10500,
    valueAsOf: "2026-07-16",
  });
  const fixture = {
    stockAsset: await getInvestmentAssetDetails(stock.id),
    fixedAsset: await getInvestmentAssetDetails(fixed.id),
    accounts: await listAccounts(),
    categories: await listCategories(),
    transactions: await listTransactions({ competenceMonth: "2026-07" }),
    transfers: await listTransfers({ competenceMonth: "2026-07" }),
    recurring: await listRecurringTemplates(),
    dashboard: await getMonthlyDashboard("2026-07"),
    evolution: await getMonthlyEvolution(["2026-06", "2026-07"]),
    expenses: await getMonthlyExpenseFeed("2026-07"),
    spending: await getCategorySpendingReport("2026-07"),
    creditCard: await getCreditCardOverview("2026-07"),
    goals: await getGoalsDashboard(),
    portfolio: await getInvestmentPortfolioDashboard(),
    history: await getInvestmentContributionHistory(),
    projection: await getInvestmentProjection(),
    overview: await getInvestmentOverview(),
    composition: await getEmergencyReserveComposition(),
    positions: await listLongTermInvestmentPositions(),
    projectedBalance: await getProjectedBalance(
      parseProjectedBalanceSearchParams(
        new URLSearchParams({
          period: "next_30_days",
          startDate: "2026-07-16",
        }),
      ),
    ),
  };
  await mkdir("tests/frontend/fixtures", { recursive: true });
  await writeFile(
    "tests/frontend/fixtures/finance.json",
    JSON.stringify(fixture, null, 2) + "\n",
  );
}
generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
