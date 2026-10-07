"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { ReportInitialProps } from "@/lib/interfaces/reports";

export function ReportNotes({ report }: ReportInitialProps) {
  const { formatCurrency } = useFinancialFormatter();
  return <Card className="shadow-none">
    <CardHeader><CardTitle><h2>Leitura do relatório</h2></CardTitle><CardDescription>Competência, pendências e critérios de cálculo</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><StatusDotBadge tone="text-warning">{report.pending.count} pendentes</StatusDotBadge><p className="text-sm text-content">Pendências de lançamentos: {formatCurrency(report.pending.amountCents)} (soma dos valores, incluindo créditos).</p></div>
      <p className="text-xs leading-5 text-content">Parcelas de cartão são compromissos por competência, não comprovantes de pagamento. Os totais não representam o saldo atual das contas.</p>
      <section className="space-y-3 border-t border-border pt-4"><h3 className="text-sm font-medium">Como calculamos</h3><div className="grid gap-3 text-xs leading-5 text-content lg:grid-cols-2">
        <p>Resultado antes dos investimentos = receitas − despesas. Taxa de economia = resultado antes dos investimentos / receitas × 100, apenas com receitas positivas.</p>
        <p>Saldo livre = resultado antes dos investimentos − (aportes − resgates). Transferências e valorização da carteira não são receitas ou despesas.</p>
        <p>Regime de competência: lançamentos pendentes e efetivados, cancelados excluídos. Cartão pelo mês da parcela; pagamentos de fatura excluídos para evitar duplicidade.</p>
        <p>Taxa anual calculada sobre os totais, sem média de percentuais mensais. Ausência de registros não comprova ausência de movimentação.</p>
      </div></section>
      {!report.entryCount && <FinanceEmptyState title="Sem registros no período" description="Confira os lançamentos e a competência selecionada." />}
    </CardContent>
  </Card>;
}
