"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { Meter } from "@/components/finance/ds/meter";
import { SectionCard } from "@/components/finance/ds/section-card";
import { InvestmentOverviewLink } from "@/components/finance/investment-overview-link";
import { PageHeader } from "@/components/finance/page-header";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { toPercent } from "@/lib/finance-tone";
import { investmentAssetClassLabels } from "@/lib/finance-ui";
import type { Tone } from "@/lib/interfaces/design-system";
import type { InvestmentOverviewViewProps } from "@/lib/interfaces/investment-operations";
import { ArrowRight, ChartPie, Landmark, PiggyBank, ReceiptText, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";

const classTones: Tone[] = ["1", "5", "2", "6", "7", "3", "4", "8"];

export function InvestmentOverviewView({ overview }: InvestmentOverviewViewProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const ResultIcon = overview.resultCents >= 0 ? TrendingUp : TrendingDown;
  const reserveShare = toPercent(overview.reserve.amountCents, overview.totalCents);
  return <div className="space-y-6">
    <PageHeader eyebrow="Investimentos" title="Investimentos" description="Reserva de emergência e carteira de longo prazo em uma leitura consolidada, com custo conhecido e resultado operacional." actions={<Button asChild><Link href="/investments/portfolio">Abrir carteira <ArrowRight className="size-4" /></Link></Button>} />
    <HeroPanel
      eyebrow="Patrimônio investido"
      value={formatCurrency(overview.totalCents)}
      caption="Reserva + longo prazo"
      aside={
        <div className="flex w-full flex-col justify-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-xs font-semibold text-white/80">Como o patrimônio está dividido</p>
          <div aria-hidden="true" className="flex h-3 gap-1 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-white transition-[width] duration-500" style={{ width: hidden ? "50%" : `${reserveShare}%` }} />
            <div className="h-full flex-1 rounded-full bg-white/35" />
          </div>
          <div className="flex justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-white" />Reserva {hidden ? "" : `${reserveShare.toFixed(0)}%`}</span>
            <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-white/35" />Longo prazo {hidden ? "" : `${(100 - reserveShare).toFixed(0)}%`}</span>
          </div>
        </div>
      }
    >
      <HeroStat label="Reserva" value={formatCurrency(overview.reserve.amountCents)} hint={overview.reserve.configured ? "Liquidez preservada" : "Ainda não configurada"} icon={<PiggyBank />} />
      <HeroStat label="Longo prazo" value={formatCurrency(overview.portfolioCents)} hint="Ações, FIIs, ETFs e renda fixa" icon={<WalletCards />} />
      <HeroStat label="Custo conhecido" value={formatCurrency(overview.knownCostCents)} hint="Base das posições com custo" icon={<ReceiptText />} />
      <HeroStat label="Resultado conhecido" value={formatCurrency(overview.resultCents)} hint="Somente posições com custo informado" icon={<ResultIcon />} />
    </HeroPanel>
    <section aria-label="Atalhos de investimentos" className="grid gap-4 md:grid-cols-2">
      <InvestmentOverviewLink href="/investments/emergency-reserve" icon={<PiggyBank />} tone="success" title="Reserva de emergência" detail={overview.reserve.configured ? "Saldo estimado, aportes e projeção" : "Configure o primeiro saldo de referência"} value={formatCurrency(overview.reserve.amountCents)} action="Acompanhar reserva" />
      <InvestmentOverviewLink href="/investments/portfolio" icon={<Landmark />} tone="violet" title="Carteira de longo prazo" detail="Posições, cotações e resultado por ativo" value={formatCurrency(overview.portfolioCents)} action="Ver posições" />
    </section>
    <SectionCard title="Distribuição por classe" description="Alocação de longo prazo · reserva excluída desta distribuição" icon={<ChartPie />} tone="violet">
      {overview.distribution.length ? (
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {overview.distribution.map((item, index) => {
            const percentage = toPercent(item.amountCents, overview.portfolioCents);
            const tone = classTones[index % classTones.length];
            return (
              <div key={item.assetClass} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium"><span aria-hidden="true" className={`tone-fill tone-${tone} size-2.5 rounded-full`} />{investmentAssetClassLabels[item.assetClass]}</span>
                  <span className="text-content-strong tabular-nums">{formatCurrency(item.amountCents)} · {percentage.toFixed(1)}%</span>
                </div>
                <Meter value={hidden ? 0 : percentage} tone={tone} />
              </div>
            );
          })}
        </div>
      ) : <p className="py-8 text-center text-sm text-content-muted">Cadastre ativos de longo prazo para ver a distribuição.</p>}
    </SectionCard>
  </div>;
}
