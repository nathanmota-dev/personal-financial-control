import { formatCurrency } from "@/lib/finance-ui";
import type { DashboardComparison, DashboardComparisons, DashboardMetricKey, DashboardMonth } from "@/lib/interfaces/dashboard";

export function compareDashboardMetric(
  currentCents: number,
  previousCents: number,
  hasPreviousMovements: boolean,
  preference: "higher" | "lower" | "neutral" = "higher",
): DashboardComparison {
  const differenceCents = currentCents - previousCents;
  const direction = differenceCents > 0 ? "up" : differenceCents < 0 ? "down" : "stable";
  const tone = !hasPreviousMovements || direction === "stable" || preference === "neutral"
    ? "neutral"
    : (differenceCents > 0) === (preference === "higher") ? "positive" : "negative";
  const percentage = previousCents > 0 && currentCents >= 0
    ? differenceCents / previousCents * 100 : null;
  const magnitude = percentage === null
    ? formatCurrency(Math.abs(differenceCents))
    : Math.abs(percentage) > 0 && Math.abs(percentage) < 0.1
      ? "menos de 0,1%"
      : `${Math.abs(percentage).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  const valueLabel = !hasPreviousMovements ? "—" : direction === "stable" ? "Sem variação"
    : `${differenceCents > 0 ? "+" : "−"}${magnitude}`;
  const description = !hasPreviousMovements ? "Sem movimentações no mês anterior"
    : direction === "stable" ? "Sem variação em relação ao mês anterior"
    : `${direction === "up" ? "Aumento" : "Queda"} de ${magnitude} em relação ao mês anterior`;
  return { differenceCents, direction, tone, percentage, valueLabel, description };
}

export function buildDashboardComparisons(current: DashboardMonth, previous: DashboardMonth): DashboardComparisons {
  const compare = (key: DashboardMetricKey, preference: "higher" | "lower" | "neutral") =>
    compareDashboardMetric(current.totals[key], previous.totals[key], previous.hasMovements, preference);
  return {
    incomeCents: compare("incomeCents", "higher"),
    fixedExpenseCents: compare("fixedExpenseCents", "lower"),
    variableExpenseCents: compare("variableExpenseCents", "lower"),
    netInvestmentFlowCents: compare("netInvestmentFlowCents", "neutral"),
    netResultCents: compare("netResultCents", "higher"),
  };
}

export function buildDashboardChartSummary(evolution: DashboardMonth[], balanceComparison: DashboardComparison) {
  const accumulatedCents = evolution.reduce((sum, item) => sum + item.totals.netResultCents, 0);
  return {
    averageIncomeCents: evolution.length ? evolution.reduce((sum, item) => sum + item.totals.incomeCents, 0) / evolution.length : 0,
    accumulatedCents,
    resultLabel: accumulatedCents > 0 ? "positivo" : accumulatedCents < 0 ? "negativo" : "neutro",
    balanceComparison,
  };
}
