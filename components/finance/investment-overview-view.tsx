"use client";

import { InvestmentOverviewMetric } from "@/components/finance/investment-overview-metric";
import { ArrowRight,Landmark,PiggyBank,TrendingDown,TrendingUp,WalletCards } from "lucide-react";
import Link from "next/link";

import { financePanelClassName } from "@/components/finance/finance-styles";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { investmentAssetClassLabels } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { InvestmentOverviewViewProps } from "@/lib/interfaces/investment-operations";

export function InvestmentOverviewView({ overview }: InvestmentOverviewViewProps) {
  const { formatCurrency } = useFinancialFormatter();
  const ResultIcon = overview.resultCents >= 0 ? TrendingUp : TrendingDown;
  return <div className="space-y-6">
    <PageHeader eyebrow="Investimentos" title="Investimentos" description="Reserva de emergência e carteira de longo prazo em uma leitura consolidada, com custo conhecido e resultado operacional." actions={<Button asChild><Link href="/investments/portfolio">Abrir carteira <ArrowRight className="size-4" /></Link></Button>} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <InvestmentOverviewMetric icon={<Landmark className="size-5" />} label="Patrimônio investido" value={formatCurrency(overview.totalCents)} detail="Reserva + longo prazo" tone="cyan" />
      <InvestmentOverviewMetric icon={<PiggyBank className="size-5" />} label="Reserva" value={formatCurrency(overview.reserve.amountCents)} detail={overview.reserve.configured ? "Liquidez preservada" : "Ainda não configurada"} tone="teal" href="/investments/emergency-reserve" />
      <InvestmentOverviewMetric icon={<WalletCards className="size-5" />} label="Longo prazo" value={formatCurrency(overview.portfolioCents)} detail={<>Custo conhecido: {formatCurrency(overview.knownCostCents)}</>} tone="blue" />
      <InvestmentOverviewMetric icon={<ResultIcon className="size-5" />} label="Resultado conhecido" value={formatCurrency(overview.resultCents)} detail="Somente posições com custo informado" tone={overview.resultCents >= 0 ? "green" : "red"} />
    </section>
    <section className={`${financePanelClassName} p-6`}>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-content-strong">Distribuição por classe</h2><p className="mt-1 text-xs text-content-muted">Alocação de longo prazo</p></div><p className="text-xs text-content-muted">Reserva excluída desta distribuição</p></div>
      <div className="mt-6 space-y-5">{overview.distribution.length ? overview.distribution.map((item, index) => { const percentage = overview.portfolioCents ? item.amountCents / overview.portfolioCents * 100 : 0; return <div key={item.assetClass}><div className="mb-2 flex justify-between text-sm"><span>{investmentAssetClassLabels[item.assetClass]}</span><span className="tabular-nums text-content-strong">{formatCurrency(item.amountCents)} · {percentage.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--chart-rail)]"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: `var(--chart-${index % 5 + 1})` }} /></div></div>; }) : <p className="py-8 text-center text-sm text-content-muted">Cadastre ativos de longo prazo para ver a distribuição.</p>}</div>
    </section>
  </div>;
}
