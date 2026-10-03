import { FinanceMetric } from "@/components/finance/finance-metric";
import type { MetricCardProps } from "@/app/interfaces/projected-balance";

export function ProjectionMetricCard({ label, value, description, icon, tone }: MetricCardProps) {
  return <FinanceMetric label={label} value={value} description={description} icon={icon} tone={tone === "rose" ? "danger" : tone === "amber" ? "warning" : tone === "emerald" ? "success" : "brand"} />;
}
