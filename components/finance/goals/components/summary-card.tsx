import { FinanceMetric } from "@/components/finance/finance-metric";
import type { SummaryCardProps } from "../goals-types";

export function SummaryCard({ label, value, icon, tone }: SummaryCardProps) {
  return <FinanceMetric label={label} value={value} icon={icon} tone={tone === "rose" ? "danger" : tone === "amber" ? "warning" : tone === "teal" ? "success" : "brand"} />;
}
