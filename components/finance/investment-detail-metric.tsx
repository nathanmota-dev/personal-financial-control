import { financeMetricClassName } from "@/components/finance/finance-styles";
import type { DetailMetricProps } from "@/lib/interfaces/investment-operations";

export function InvestmentDetailMetric({ label, value, tone = "neutral" }: DetailMetricProps) {
  return <div className={`${financeMetricClassName} p-5`}><p className="text-xs uppercase tracking-wider text-content-muted">{label}</p><p className={`mt-3 text-xl font-semibold ${tone === "positive" ? "text-emerald-300" : tone === "negative" ? "text-rose-300" : "text-content-strong"}`}>{value}</p></div>;
}
