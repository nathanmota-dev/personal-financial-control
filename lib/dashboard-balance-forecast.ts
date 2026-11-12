import type {
  DashboardBalanceForecastData,
  DashboardBalanceForecastKey,
  DashboardBalanceForecastSegment,
} from "@/lib/interfaces/dashboard-balance-forecast";
import type { DashboardTotals } from "@/lib/interfaces/dashboard";

const SEGMENTS: { key: DashboardBalanceForecastKey; label: string; colorClassName: string }[] = [
  { key: "fixed", label: "Gastos fixos", colorClassName: "bg-[#1d4f9b]" },
  { key: "variable", label: "Gastos variáveis", colorClassName: "bg-chart-1" },
  { key: "investments", label: "Investimentos", colorClassName: "bg-chart-3" },
  { key: "free", label: "Saldo livre", colorClassName: "bg-success" },
];

function percentOf(cents: number, baseCents: number) {
  return baseCents > 0 ? Math.round((cents / baseCents) * 100) : null;
}

/** Splits the month's income into fixed, variable, investments and the free balance, like the metric cards. */
export function buildDashboardBalanceForecast(totals: DashboardTotals): DashboardBalanceForecastData {
  const amounts: Record<DashboardBalanceForecastKey, number> = {
    fixed: totals.fixedExpenseCents,
    // Uncategorized spending is subtracted from the free balance, so it counts as variable here.
    variable: totals.variableExpenseCents + totals.uncategorizedExpenseCents,
    investments: totals.netInvestmentFlowCents,
    free: totals.netResultCents,
  };
  const barCents = (key: DashboardBalanceForecastKey) => Math.max(0, amounts[key]);
  const barTotal = SEGMENTS.reduce((sum, { key }) => sum + barCents(key), 0);
  // When the spending passes the income the bar still fills the track, split proportionally.
  const base = Math.max(totals.incomeCents, barTotal);
  const segments: DashboardBalanceForecastSegment[] = SEGMENTS.map(({ key, label, colorClassName }) => ({
    key,
    label,
    amountCents: amounts[key],
    percent: percentOf(amounts[key], totals.incomeCents),
    width: base > 0 ? (barCents(key) / base) * 100 : 0,
    colorClassName,
  }));
  return {
    incomeCents: totals.incomeCents,
    freeCents: totals.netResultCents,
    freePercent: percentOf(totals.netResultCents, totals.incomeCents),
    segments,
  };
}
