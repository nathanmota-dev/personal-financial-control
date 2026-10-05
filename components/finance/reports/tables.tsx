import { DashboardEvolutionChart } from "@/components/finance/dashboard-evolution-chart";
import Link from "next/link";
import { formatCurrency, formatMonthLabel, transactionTypeLabels } from "@/lib/finance-ui";
import type { TransactionType } from "@/lib/db/schema";
import type { ReportProps } from "@/lib/interfaces/reports";
import { reportHref } from "@/lib/report-periods";

export function ReportTables({ report }: ReportProps) {
  return <div className="space-y-6">
    <section className="rounded-2xl bg-card p-5">
      <h2 className="text-lg font-semibold">Meses do ano</h2>
      <DashboardEvolutionChart evolution={report.series.map(({ month, metrics }) => ({
        month: month.slice(5), income: metrics.incomeCents / 100, expenses: metrics.expenseCents / 100,
        investments: metrics.netInvestmentFlowCents / 100, net: metrics.netResultCents / 100,
      }))} />
      <p className="my-3 text-sm text-content">Média de receitas: {report.averageIncomeCents === null ? "Não aplicável" : formatCurrency(report.averageIncomeCents)}. Divisor: {report.averageDivisor} {report.mode === "monthly" ? "mês selecionado" : "meses incluídos"}. Meses sem registros entram com zero; meses futuros ficam fora da série e da média anual.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm tabular-nums"><caption className="sr-only">Receitas, despesas e resultados por mês</caption>
        <thead><tr>{["Mês", "Receitas", "Despesas", "Resultado", "Investimentos líquidos", "Saldo livre", "Taxa"].map((label) => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead>
        <tbody>{report.series.map(({ month, metrics: m, hasMovements }) => <tr key={month} className="border-t"><th className="p-3 font-normal"><Link className="text-brand underline" href={reportHref("monthly", month)}>{formatMonthLabel(month)}</Link>{!hasMovements && <span className="block text-xs text-content">Sem registros</span>}</th>
          {[m.incomeCents, m.expenseCents, m.operatingResultCents, m.netInvestmentFlowCents, m.netResultCents].map((value, index) => <td className="whitespace-nowrap p-3" key={index}>{formatCurrency(value)}</td>)}<td className="p-3">{m.savingsRate === null ? "Não aplicável" : `${m.savingsRate.toFixed(2)}%`}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section className="rounded-2xl bg-card p-5"><h2 className="text-lg font-semibold">Categorias e comparação</h2>
      <p className="my-3 text-sm text-content">Inclui categorias arquivadas e créditos negativos. Comparação com {report.previousPeriod}{report.partial ? " completo, enquanto o período selecionado é parcial" : ""}.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Categoria</th><th>Tipo</th><th>Selecionado</th><th>Anterior</th><th>Variação absoluta</th></tr></thead>
        <tbody>{report.categories.map((row) => <tr key={row.id} className="border-t"><th className="p-3 font-normal">{row.name}</th><td>{transactionTypeLabels[row.type as TransactionType]}</td><td className="whitespace-nowrap p-3">{formatCurrency(row.amountCents)}</td><td className="whitespace-nowrap p-3">{formatCurrency(row.previousCents)}</td><td className="whitespace-nowrap p-3">{formatCurrency(row.amountCents - row.previousCents)}</td></tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}
