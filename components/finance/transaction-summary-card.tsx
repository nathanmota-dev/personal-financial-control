import { FinanceMetric } from "@/components/finance/finance-metric";
import type { TransactionSummaryCardProps } from "@/lib/interfaces/transactions";
import { ArrowDownLeft,ArrowUpRight,TrendingDown,TrendingUp } from "lucide-react";

const metrics = {
  cyan: { icon: TrendingUp, tone: "success", description: "Entradas no período selecionado" },
  blue: { icon: TrendingDown, tone: "danger", description: "Saídas no período selecionado" },
  sky: { icon: ArrowUpRight, tone: "brand", description: "Valores destinados a investimentos" },
  amber: { icon: ArrowDownLeft, tone: "warning", description: "Valores resgatados dos investimentos" },
} as const;

export function TransactionSummaryCard({ label, value, tone }: TransactionSummaryCardProps) {
  const metric = metrics[tone];
  const Icon = metric.icon;
  return <FinanceMetric label={label} value={value} description={metric.description} tone={metric.tone} icon={<Icon />} />;
}
