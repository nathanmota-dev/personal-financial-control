import { FinanceMetric } from "@/components/finance/finance-metric";
import type { OverviewMetricProps } from "@/lib/interfaces/investment-operations";
import Link from "next/link";

export function InvestmentOverviewMetric({ icon, label, value, detail, tone, href }: OverviewMetricProps) {
  const content = <FinanceMetric label={label} value={value} description={detail} icon={icon} tone={tone === "red" ? "danger" : tone === "teal" || tone === "green" ? "success" : "brand"} className="h-full" />;
  return href ? <Link href={href} className="rounded-[20px] transition-colors hover:ring-1 hover:ring-border focus-visible:outline-2 focus-visible:outline-ring">{content}</Link> : content;
}
