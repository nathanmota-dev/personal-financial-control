import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatMonthLabel } from "@/lib/finance-ui";
import { reportHref } from "@/lib/report-periods";
import type { ReportMonthsProps } from "@/lib/interfaces/reports";

export function ReportMonthlyTable({ report }: ReportMonthsProps) {
  return <Card className="min-w-0 shadow-none">
    <CardHeader><CardTitle><h2>Meses do ano</h2></CardTitle><CardDescription>Receitas, despesas e resultados por competência</CardDescription></CardHeader>
    <CardContent>
      <Table className="tabular-nums">
        <TableCaption className="sr-only">Receitas, despesas e resultados por mês</TableCaption>
        <TableHeader><TableRow><TableHead>Mês</TableHead>{["Receitas", "Despesas", "Resultado", "Investimentos líquidos", "Saldo livre", "Taxa"].map((label) => <TableHead className="text-right" key={label}>{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{report.series.map(({ month, metrics, hasMovements }) => <TableRow key={month}>
          <TableCell><Link className="font-medium text-content-strong hover:underline" href={reportHref("monthly", month)}>{formatMonthLabel(month)}</Link>{!hasMovements && <span className="mt-1 block text-xs text-content-muted">Sem registros</span>}</TableCell>
          {[metrics.incomeCents, metrics.expenseCents, metrics.operatingResultCents, metrics.netInvestmentFlowCents, metrics.netResultCents].map((value, index) => <TableCell className="text-right" key={index}>{formatCurrency(value)}</TableCell>)}
          <TableCell className="text-right">{metrics.savingsRate === null ? "Não aplicável" : `${metrics.savingsRate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </CardContent>
  </Card>;
}
