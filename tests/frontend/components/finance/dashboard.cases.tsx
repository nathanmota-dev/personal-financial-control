import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardMetric } from "@/components/finance/dashboard-metric";
import { DashboardCategoryCharts } from "@/components/finance/dashboard-category-charts";
import { DashboardDetails } from "@/components/finance/dashboard-details";
import { DashboardChartSummary } from "@/components/finance/dashboard-chart-summary";
import { compareDashboardMetric } from "@/lib/dashboard-comparisons";
import { dashboardFixture } from "@/tests/frontend/fixtures/dashboard";
import { renderUI } from "@/tests/frontend/helpers";

describe("dashboard sections", () => {
  it.each([
    [200, 100, true, "higher", "text-success", "lucide-trending-up"],
    [100, 200, true, "higher", "text-danger", "lucide-trending-down"],
    [200, 100, true, "lower", "text-danger", "lucide-trending-up"],
    [100, 200, true, "lower", "text-success", "lucide-trending-down"],
    [100, 100, true, "higher", "text-content-subtle", "lucide-minus"],
    [100, 0, false, "higher", "text-content-subtle", "lucide-minus"],
    [200, 100, true, "neutral", "text-content-subtle", "lucide-trending-up"],
  ] as const)("shows the real direction and tone for %s versus %s", (current, previous, history, preference, tone, icon) => {
    const comparison = compareDashboardMetric(current, previous, history, preference);
    renderUI(<DashboardMetric label="Example" value="R$ 1,00" comparison={comparison} />);
    const element = screen.getByLabelText(comparison.description);
    expect(element).toHaveClass(icon);
    expect(element.parentElement).toHaveClass(tone);
  });
  it("displays credits separately from expense percentages with the net total explicit", () => {
    renderUI(<DashboardCategoryCharts categorySpending={[
      { categoryId: "food", categoryName: "Food", amountCents: 10000 },
      { categoryId: "credit", categoryName: "Refund", amountCents: -15000 },
    ]} />);
    expect(screen.getByText("Categorias com créditos líquidos")).toBeVisible();
    expect(screen.getByText("100%")).toBeVisible();
    expect(screen.getByText("Total líquido").parentElement).toHaveTextContent("-R$ 50,00");
  });
  it("shows successful empty data without a misleading positive accumulated result", () => {
    renderUI(<><DashboardCategoryCharts categorySpending={[]} />
      <DashboardDetails dashboard={{ ...dashboardFixture.dashboard, accountBalances: [] }} expenses={[]} investmentOverview={{ ...dashboardFixture.investmentOverview, totalCents: 0, reserve: { configured: false, purposeId: null, amountCents: 0 }, portfolioCents: 0 }} />
      <DashboardChartSummary summary={{ averageIncomeCents: 0, accumulatedCents: 0, resultLabel: "neutro", balanceComparison: compareDashboardMetric(0, 0, false) }} />
    </>);
    expect(screen.getByText("Nenhuma conta cadastrada.")).toBeVisible();
    expect(screen.getByText("A carteira ainda não foi configurada.")).toBeVisible();
    expect(screen.getByText("Resultado acumulado neutro")).toBeVisible();
    expect(screen.getByText("Sem despesas relevantes")).toBeVisible();
    expect(screen.getByText("Nenhuma despesa líquida positiva neste mês.")).toBeVisible();
  });
});
