"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { formatMonthLabel, getTransactionTone, transactionTypeLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { TransactionType } from "@/lib/db/schema";
import type { ReportCategoryProps } from "@/lib/interfaces/reports";

export function ReportCategoryTable({ report }: ReportCategoryProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <Card className="min-w-0 shadow-none">
    <CardHeader><CardTitle><h2>Categorias e comparação</h2></CardTitle><CardDescription>Inclui categorias arquivadas e créditos negativos. Comparação com {report.previousPeriod.length === 7 ? formatMonthLabel(report.previousPeriod) : report.previousPeriod}{report.partial ? " completo, enquanto o período selecionado é parcial" : ""}.</CardDescription></CardHeader>
    <CardContent>{report.categories.length ? <Table>
      <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Selecionado</TableHead><TableHead className="text-right">Anterior</TableHead><TableHead className="text-right">Variação absoluta</TableHead></TableRow></TableHeader>
      <TableBody>{report.categories.map((row) => <TableRow key={row.id}>
        <TableCell className="font-medium">{row.name}</TableCell>
        <TableCell><StatusDotBadge tone={getTransactionTone(row.type as TransactionType)}>{transactionTypeLabels[row.type as TransactionType]}</StatusDotBadge></TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(row.amountCents)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(row.previousCents)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(row.amountCents - row.previousCents)}</TableCell>
      </TableRow>)}</TableBody>
    </Table> : <FinanceEmptyState title="Sem categorias no período" description="As categorias aparecerão quando houver lançamentos na competência selecionada ou anterior." />}</CardContent>
  </Card>;
}
