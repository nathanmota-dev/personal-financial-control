import { FinanceMetric } from "@/components/finance/finance-metric";
import type { DetailMetricProps } from "@/lib/interfaces/investment-operations";

export function InvestmentDetailMetric({ label, value, tone = "neutral" }: DetailMetricProps) {
  return <FinanceMetric label={label} value={value} className={tone === "positive" ? "[&_[data-slot=card-content]>p]:text-success" : tone === "negative" ? "[&_[data-slot=card-content]>p]:text-danger" : undefined} />;
}
