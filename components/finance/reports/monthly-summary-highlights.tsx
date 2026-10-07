"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportEntrySource } from "@/components/finance/reports/entry-source";
import { formatMonthLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { MonthlyRetrospectiveProps } from "@/lib/interfaces/monthly-retrospective";

export function MonthlySummaryHighlights({ summary }: MonthlyRetrospectiveProps) {
  const { formatCurrency } = useFinancialFormatter();
  const { largestExpense, largestCategory } = summary;
  return <section aria-label="Destaques das despesas" className="grid gap-4 lg:grid-cols-2">
    <Card className="min-w-0 shadow-none">
      <CardHeader><CardTitle><h3>Maior despesa positiva</h3></CardTitle><CardDescription>Valor reconhecido na competência</CardDescription></CardHeader>
      <CardContent className="space-y-3">{largestExpense ? <>
        <p className="text-2xl font-semibold tabular-nums">{formatCurrency(largestExpense.amountCents)}</p>
        <p className="break-words font-medium">{largestExpense.description}</p>
        <p className="text-xs leading-5 text-content">{largestExpense.category} · {largestExpense.account} · {formatMonthLabel(largestExpense.month)}{largestExpense.source === "installment" && " (parcela reconhecida no mês)"}</p>
        <ReportEntrySource entry={largestExpense} />
      </> : <p className="text-sm text-content">Sem despesa positiva registrada.</p>}</CardContent>
    </Card>
    <Card className="min-w-0 shadow-none">
      <CardHeader><CardTitle><h3>Categoria de maior despesa líquida positiva</h3></CardTitle><CardDescription>Despesas após créditos da categoria</CardDescription></CardHeader>
      <CardContent className="space-y-3">{largestCategory ? <>
        <p className="text-2xl font-semibold tabular-nums">{formatCurrency(largestCategory.amountCents)}</p>
        <p className="font-medium">{largestCategory.name}</p>
        <p className="text-xs leading-5 text-content">{summary.entries.filter((entry) => entry.type === "expense" && `expense:${entry.categoryId}` === largestCategory.id).length} movimentações na categoria, incluindo parcelas e créditos.</p>
      </> : <p className="text-sm text-content">Sem categoria com despesa líquida positiva.</p>}</CardContent>
    </Card>
  </section>;
}
