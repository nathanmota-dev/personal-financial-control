import { formatCurrency } from "@/lib/finance-ui";
import type { ReportProps } from "@/lib/interfaces/reports";

export function ReportSummary({ report }: ReportProps) {
  const { totals, comparison } = report;
  const metrics = [
    ["Receitas", totals.incomeCents], ["Despesas", totals.expenseCents],
    ["Resultado antes dos investimentos", totals.operatingResultCents],
    ["Aportes", totals.investmentContributionCents], ["Resgates", totals.investmentWithdrawalCents],
    ["Investimentos líquidos", totals.netInvestmentFlowCents], ["Saldo livre", totals.netResultCents],
  ] as const;
  return <section aria-label="Resultado do período" className="space-y-4 rounded-2xl bg-card p-5 sm:p-6">
    <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(([label, value]) => <div key={label}><dt className="text-xs text-content">{label}</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(value)}</dd></div>)}
      <div><dt className="text-xs text-content">Taxa de economia</dt><dd className="mt-1 text-xl font-semibold text-brand">{totals.savingsRate === null ? "Não aplicável" : `${totals.savingsRate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`}</dd></div>
    </dl>
    <p className="text-sm">Variação do resultado antes dos investimentos em relação a {report.previousPeriod}: {comparison.hasHistory ? `${formatCurrency(comparison.differenceCents)} (${comparison.percentage === null ? "percentual não aplicável" : `${comparison.percentage.toFixed(2)}%`})` : "Sem movimentações no período anterior; comparação percentual não aplicável."}</p>
    {report.partial && <p role="note" className="text-sm text-brand">Período parcial. Comparação com o período anterior completo; a diferença não indica uma tendência conclusiva.</p>}
    {report.future && <p role="note" className="text-sm">Período futuro: valores representam compromissos registrados, não resultados realizados. Meses futuros não entram nas médias anuais.</p>}
    <p className="text-sm">Pendências de lançamentos: {formatCurrency(report.pending.amountCents)} em {report.pending.count} registros (soma dos valores, incluindo créditos). Parcelas de cartão são compromissos por competência, não comprovantes de pagamento.</p>
    <details className="text-sm"><summary className="cursor-pointer text-brand">Como calculamos</summary><div className="mt-3 max-w-3xl space-y-2 text-content">
      <p>Resultado antes dos investimentos = receitas − despesas. Taxa de economia = resultado antes dos investimentos / receitas × 100, apenas com receitas positivas.</p>
      <p>Saldo livre = resultado antes dos investimentos − (aportes − resgates). Transferências e valorização da carteira não são receitas ou despesas.</p>
      <p>Regime de competência: lançamentos pendentes e efetivados, cancelados excluídos. Cartão pelo mês da parcela; pagamentos de fatura excluídos para evitar duplicidade. Os valores não representam o saldo atual das contas.</p>
      <p>Taxa anual calculada sobre os totais, sem média de percentuais mensais. Ausência de registros não comprova ausência de movimentação.</p>
    </div></details>
    {!report.entries.length && <p>Sem registros no período. Confira os lançamentos e a competência selecionada.</p>}
  </section>;
}
