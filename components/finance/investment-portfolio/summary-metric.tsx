import { FinanceMetric } from "@/components/finance/finance-metric";
import type { SummaryMetricProps } from "@/lib/interfaces/investment-portfolio";

export function SummaryMetric({ label, value, detail, icon, tone }: SummaryMetricProps) {
  return <FinanceMetric label={label} value={value} description={detail} icon={icon} tone={tone === "amber" ? "warning" : tone === "teal" ? "success" : "brand"} />;
}
