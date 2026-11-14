import { describe, expect, it } from "vitest";

import { buildDashboardInvestments } from "@/lib/dashboard-investments";
import type { InvestmentOverview } from "@/lib/interfaces/investment-operations";

const overview = (reserve: number, portfolio: number, distribution: InvestmentOverview["distribution"] = []) =>
  ({ pendingWithdrawals: [], totalCents: reserve + portfolio, reserve: { amountCents: reserve, purposeId: null, configured: true }, bank: null, portfolioCents: portfolio, knownCostCents: 0, resultCents: 500, distribution, history: [], lastUpdatedAt: null }) as InvestmentOverview;

describe("buildDashboardInvestments", () => {
  it("splits reserve and portfolio and lists the biggest asset classes first", () => {
    const data = buildDashboardInvestments(overview(25_000, 75_000, [{ assetClass: "equities", amountCents: 20_000 }, { assetClass: "fixed_income", amountCents: 55_000 }]));
    expect(data).toMatchObject({ totalCents: 100_000, reservePercent: 25, portfolioPercent: 75, resultCents: 500 });
    expect(data.items.map((item) => item.label)).toEqual(["Reserva de emergência", "Renda fixa", "Ações"]);
  });

  it("returns no items and zero percentages when nothing is invested", () => {
    const data = buildDashboardInvestments(overview(0, 0));
    expect(data).toMatchObject({ totalCents: 0, reservePercent: 0, portfolioPercent: 0, items: [] });
  });
});
