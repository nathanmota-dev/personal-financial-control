import Link from "next/link";
import { ArrowRight, Landmark, PiggyBank, TrendingDown, TrendingUp, WalletCards } from "lucide-react";

import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { financeMetricClassName, financePanelClassName } from "@/components/finance/finance-styles";
import { formatCurrency, investmentAssetClassLabels } from "@/lib/finance-ui";
import type { InvestmentOverviewViewProps, OverviewMetricProps } from "@/lib/interfaces/investment-operations";

export function InvestmentOverviewView({ overview }: InvestmentOverviewViewProps) {
  const ResultIcon = overview.resultCents >= 0 ? TrendingUp : TrendingDown;
  return <div className="space-y-6">
    <PageHeader eyebrow="Investimentos" title="Seu patrimônio, sem misturar objetivos" description="Reserva de emergência e carteira de longo prazo em uma leitura consolidada, com custo conhecido e resultado operacional." actions={<Button asChild><Link href="/investments/portfolio">Abrir carteira <ArrowRight className="size-4" /></Link></Button>} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewMetric icon={<Landmark className="size-5" />} label="Patrimônio investido" value={formatCurrency(overview.totalCents)} detail="Reserva + longo prazo" tone="cyan" />
      <OverviewMetric icon={<PiggyBank className="size-5" />} label="Reserva" value={formatCurrency(overview.reserve.amountCents)} detail={overview.reserve.configured ? "Liquidez preservada" : "Ainda não configurada"} tone="teal" href="/investments/emergency-reserve" />
      <OverviewMetric icon={<WalletCards className="size-5" />} label="Longo prazo" value={formatCurrency(overview.portfolioCents)} detail={`Custo conhecido: ${formatCurrency(overview.knownCostCents)}`} tone="blue" />
      <OverviewMetric icon={<ResultIcon className="size-5" />} label="Resultado conhecido" value={formatCurrency(overview.resultCents)} detail="Somente posições com custo informado" tone={overview.resultCents >= 0 ? "green" : "red"} />
    </section>
    <section className={`${financePanelClassName} p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-content-muted">Alocação de longo prazo</p><h2 className="mt-2 text-xl font-semibold text-content-strong">Distribuição por classe</h2></div><p className="text-sm text-content-muted">Reserva excluída desta distribuição</p></div>
      <div className="mt-6 space-y-4">{overview.distribution.length ? overview.distribution.map((item) => { const percentage = overview.portfolioCents ? item.amountCents / overview.portfolioCents * 100 : 0; return <div key={item.assetClass}><div className="mb-2 flex justify-between text-sm"><span>{investmentAssetClassLabels[item.assetClass]}</span><span className="font-mono text-content-strong">{formatCurrency(item.amountCents)} · {percentage.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-border/60"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400" style={{ width: `${percentage}%` }} /></div></div>; }) : <p className="py-8 text-center text-sm text-content-muted">Cadastre ativos de longo prazo para ver a distribuição.</p>}</div>
    </section>
  </div>;
}

function OverviewMetric({ icon, label, value, detail, tone, href }: OverviewMetricProps) {
  const colors = { cyan: "text-cyan-300", teal: "text-teal-300", blue: "text-sky-300", green: "text-emerald-300", red: "text-rose-300" };
  const content = <div className={`${financeMetricClassName} h-full p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30`}><div className={`mb-6 ${colors[tone]}`}>{icon}</div><p className="text-xs uppercase tracking-[.18em] text-content-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-content-strong">{value}</p><p className="mt-2 text-xs text-content-muted">{detail}</p></div>;
  return href ? <Link href={href}>{content}</Link> : content;
}
