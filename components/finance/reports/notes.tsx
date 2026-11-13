"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { ReportCard } from "@/components/finance/reports/report-card";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import type { ReportInitialProps } from "@/lib/interfaces/reports";

const rules = [
  { term: "Resultado e economia", detail: "Resultado antes dos investimentos = receitas − despesas. Taxa de economia = resultado antes dos investimentos / receitas × 100, apenas com receitas positivas." },
  { term: "Saldo livre", detail: "Saldo livre = resultado antes dos investimentos − (aportes − resgates). Transferências e valorização da carteira não são receitas ou despesas." },
  { term: "Competência", detail: "Regime de competência: lançamentos pendentes e efetivados, cancelados excluídos. Cartão pelo mês da parcela; pagamentos de fatura excluídos para evitar duplicidade." },
  { term: "Período anual", detail: "Taxa anual calculada sobre os totais, sem média de percentuais mensais. Ausência de registros não comprova ausência de movimentação." },
];

export function ReportNotes({ report }: ReportInitialProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <ReportCard title="Leitura do relatório" description="Competência, pendências e critérios de cálculo" illustrationSrc="/images/reports-clipboard.webp">
      <div className="flex flex-wrap items-center gap-3">
        <StatusDotBadge tone="text-warning">{report.pending.count} pendentes</StatusDotBadge>
        <p className="text-[13px] text-content">Pendências de lançamentos: <span className="font-semibold text-content-strong">{formatCurrency(report.pending.amountCents)}</span> (soma dos valores, incluindo créditos).</p>
      </div>
      <p className="mt-3 text-xs leading-5 text-content-muted">Parcelas de cartão são compromissos por competência, não comprovantes de pagamento. Os totais não representam o saldo atual das contas.</p>
      <h3 className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">Como calculamos</h3>
      <dl className="mt-1 divide-y divide-border text-[13px] leading-5">
        {rules.map((rule) => (
          <div key={rule.term} className="py-3 last:pb-0">
            <dt className="font-semibold text-content-strong">{rule.term}</dt>
            <dd className="mt-1 text-xs leading-5 text-content">{rule.detail}</dd>
          </div>
        ))}
      </dl>
      {!report.entryCount && <div className="mt-4"><FinanceEmptyState title="Sem registros no período" description="Confira os lançamentos e a competência selecionada." /></div>}
    </ReportCard>
  );
}
