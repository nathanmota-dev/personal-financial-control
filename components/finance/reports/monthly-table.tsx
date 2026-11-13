"use client";

import Link from "next/link";
import { ReportCard } from "@/components/finance/reports/report-card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMonthLabel } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { reportHref } from "@/lib/report-periods";
import type { ReportMonthsProps } from "@/lib/interfaces/reports";

export function ReportMonthlyTable({ report }: ReportMonthsProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <ReportCard title="Meses do ano" description="Receitas, despesas e resultados por competência" illustrationSrc="/images/bills-calendar.webp">
      <Table className="tabular-nums">
        <TableCaption className="sr-only">Receitas, despesas e resultados por mês</TableCaption>
        <TableHeader><TableRow><TableHead>Mês</TableHead>{["Receitas", "Despesas", "Resultado", "Investimentos líquidos", "Saldo livre", "Taxa"].map((label) => <TableHead className="text-right" key={label}>{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{report.series.map(({ month, metrics, hasMovements }) => <TableRow key={month}>
          <TableCell><Link className="font-medium text-content-strong hover:underline" href={reportHref("monthly", month)}>{formatMonthLabel(month)}</Link>{!hasMovements && <span className="mt-1 block text-xs text-content-muted">Sem registros</span>}</TableCell>
          {[metrics.incomeCents, metrics.expenseCents, metrics.operatingResultCents, metrics.netInvestmentFlowCents, metrics.netResultCents].map((value, index) => <TableCell className={index === 4 ? "text-right font-semibold" : "text-right"} key={index}>{formatCurrency(value)}</TableCell>)}
          <TableCell className="text-right">{metrics.savingsRate === null ? "Não aplicável" : `${metrics.savingsRate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
  </ReportCard>;
}
