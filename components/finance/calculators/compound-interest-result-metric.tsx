import { FinanceMetric } from "@/components/finance/finance-metric";
import type { CompoundInterestResultMetricProps } from "@/lib/interfaces/compound-interest";

export function CompoundInterestResultMetric({ title, value, detail, icon, featured = false }: CompoundInterestResultMetricProps) {
  return <FinanceMetric label={title} value={value} description={detail} icon={icon} tone={featured ? "success" : "brand"} />;
}
