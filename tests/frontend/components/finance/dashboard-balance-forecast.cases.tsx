import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardBalanceForecast } from "@/components/finance/dashboard-balance-forecast";
import type { DashboardTotals } from "@/lib/interfaces/dashboard";
import { renderUI } from "@/tests/frontend/helpers";

const totals: DashboardTotals = {
  incomeCents: 1000000, fixedExpenseCents: 300000, variableExpenseCents: 200000, uncategorizedExpenseCents: 0,
  investmentContributionCents: 100000, investmentWithdrawalCents: 0, netInvestmentFlowCents: 100000, netResultCents: 400000,
};

describe("dashboard balance forecast", () => {
  it("shows the free balance, its share of the income and the legend", () => {
    renderUI(<DashboardBalanceForecast totals={totals} />);
    expect(screen.getByRole("region", { name: "Saldo previsto" })).toHaveTextContent("40% da receita livre");
    expect(screen.getByText("Receitas")).toBeVisible();
    for (const label of ["Gastos fixos", "Gastos variáveis", "Investimentos", "= Saldo livre"]) expect(screen.getByText(label)).toBeVisible();
    expect(screen.getByTestId("balance-forecast-bar").children).toHaveLength(4);
  });

  it("marks a negative balance and hides the share without income", () => {
    renderUI(<DashboardBalanceForecast totals={{ ...totals, incomeCents: 0, netResultCents: -50000 }} />);
    expect(screen.queryByText(/da receita livre/)).toBeNull();
  });
});
