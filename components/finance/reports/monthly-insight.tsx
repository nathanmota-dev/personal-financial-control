import { SummaryEvidence } from "@/components/finance/reports/summary-evidence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatMonthLabel } from "@/lib/finance-ui";
import type { MonthlyInsightProps } from "@/lib/interfaces/monthly-retrospective";

export function MonthlyInsight({ insight, summary }: MonthlyInsightProps) {
  const percentage = insight.percentage === null ? "" : ` (${Math.abs(insight.percentage).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`;
  const entries = [...summary.previousEntries, ...summary.entries].filter((entry) => entry.type === "expense" && `expense:${entry.categoryId}` === insight.id);
  return <li className="min-w-0"><Card className="shadow-none">
    <CardHeader><CardTitle><h4>{insight.category}</h4></CardTitle></CardHeader>
    <CardContent className="space-y-3"><p className="text-sm leading-6 text-content-strong">{insight.kind === "new"
      ? <>novo gasto no período de {formatCurrency(insight.currentCents)}.</>
      : insight.kind === "absolute"
        ? <>diferença de {formatCurrency(insight.differenceCents)} nas despesas líquidas, com base anterior sem percentual aplicável.</>
        : <>{insight.kind === "increase" ? "aumento" : "redução"} de {formatCurrency(Math.abs(insight.differenceCents))}{percentage} nas despesas líquidas.</>}</p>
    <p className="text-xs leading-5 text-content">{formatMonthLabel(summary.previousPeriod)}: {formatCurrency(insight.previousCents)}; {formatMonthLabel(summary.period)}: {formatCurrency(insight.currentCents)}.</p>
    <SummaryEvidence label={`Despesas de ${insight.category} nos dois meses`} entries={entries} />
    </CardContent>
  </Card></li>;
}
