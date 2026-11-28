import type { InvestmentBenchmarkKey, InvestmentHistoryPeriod } from "@/lib/interfaces/investment-history";

export const INVESTMENT_HISTORY_PERIODS: { value: InvestmentHistoryPeriod; label: string }[] = [
  { value: "12m", label: "12M" },
  { value: "24m", label: "24M" },
  { value: "all", label: "Tudo" },
];

export const INVESTMENT_BENCHMARK_LABELS: Record<InvestmentBenchmarkKey | "portfolio", string> = {
  portfolio: "Carteira",
  cdi: "CDI",
  ipca: "IPCA",
  ibov: "Ibovespa",
};

const percentFormatter = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });
const axisPercentFormatter = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const shareFormatter = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

export function formatSignedPercent(rate: number) {
  return percentFormatter.format(rate);
}

export function formatAxisPercent(rate: number) {
  return axisPercentFormatter.format(rate);
}

export function formatShare(rate: number) {
  return shareFormatter.format(rate);
}

export function isInvestmentHistoryPeriod(value: string): value is InvestmentHistoryPeriod {
  return INVESTMENT_HISTORY_PERIODS.some((period) => period.value === value);
}
