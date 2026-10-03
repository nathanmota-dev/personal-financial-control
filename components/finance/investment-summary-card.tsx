import { FinanceMetric } from "@/components/finance/finance-metric";
import type { InvestmentSummaryCardProps } from "@/lib/interfaces/investments";

export function InvestmentSummaryCard({ icon, label, value, detail, tone }: InvestmentSummaryCardProps) {
  return <FinanceMetric icon={icon} label={label} value={value} description={detail} tone={tone === "amber" ? "warning" : "brand"} />;
}
