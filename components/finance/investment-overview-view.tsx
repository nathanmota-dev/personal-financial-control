"use client";

import { ArrowRight, PiggyBank, ReceiptText, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";

import { BankReserveControl } from "@/components/finance/bank-reserve-control";
import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { InvestmentClassDistribution } from "@/components/finance/investment-class-distribution";
import { InvestmentOverviewLink } from "@/components/finance/investment-overview-link";
import { PageHeader } from "@/components/finance/page-header";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { toPercent } from "@/lib/finance-tone";
import { formatDateLabel } from "@/lib/finance-ui";
import type { InvestmentOverviewViewProps } from "@/lib/interfaces/investment-operations";
import { cn } from "@/lib/utils";

const gridClassName = "grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]";

export function InvestmentOverviewView({ overview }: InvestmentOverviewViewProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const reserveShare = Math.round(toPercent(overview.reserve.amountCents, overview.totalCents));
  const ResultIcon = overview.resultCents >= 0 ? TrendingUp : TrendingDown;
  const { bank } = overview;
  const reserveHint = bank ? (overview.reserve.configured ? "Definida por você" : "Ainda não definida") : overview.reserve.configured ? "Liquidez preservada" : "Ainda não configurada";
  const stats = [
    { label: "Reserva", value: formatCurrency(overview.reserve.amountCents), hint: reserveHint, icon: PiggyBank },
    { label: "Carteira", value: formatCurrency(overview.portfolioCents), hint: bank ? "Total investido menos a reserva" : "Ações, FIIs, ETFs e renda fixa", icon: WalletCards },
    { label: "Custo conhecido", value: formatCurrency(overview.knownCostCents), hint: "Base das posições com custo", icon: ReceiptText },
    { label: "Resultado conhecido", value: formatCurrency(overview.resultCents), hint: "Somente posições com custo", icon: ResultIcon, className: overview.resultCents < 0 ? "text-destructive" : "text-success" },
  ];
  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Investimentos"
        title="Investimentos"
        description="Reserva e carteira em uma leitura consolidada, com custo conhecido e resultado operacional."
        actions={
          <Button asChild className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium">
            <Link href="/investments/portfolio">Abrir carteira <ArrowRight className="size-[17px]" /></Link>
          </Button>
        }
      />
      <div className={gridClassName}>
        <section aria-label="Patrimônio investido" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
          <DashboardCardIllustration src="/images/investments-chart.webp" className="top-4 right-6 size-[96px]" />
          <h2 className="text-sm font-semibold text-content-strong">Patrimônio investido</h2>
          <DashboardCardsMoney cents={overview.totalCents} className="mt-4 block text-[48px] leading-[52px] font-bold text-content-strong" />
          <p className="mt-2 pr-24 text-xs text-content">{bank ? `Posições informadas pelo banco em ${formatDateLabel(bank.valueAsOf)}. A reserva é a parte que você define; o restante é carteira.` : "Reserva + carteira, pelo valor atual das posições."}</p>
          <div className="mt-6 flex min-h-8 flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-content">Como o patrimônio está dividido</p>
            {bank ? <BankReserveControl split={bank} /> : null}
          </div>
          {overview.totalCents > 0 && !hidden ? (
            <div aria-hidden className="mt-2 flex h-6 overflow-hidden rounded-md text-[11px] font-semibold text-white">
              {reserveShare > 0 && <div className="flex items-center justify-center bg-primary" style={{ width: `${reserveShare}%` }}>{reserveShare >= 8 ? `${reserveShare}%` : ""}</div>}
              {reserveShare > 0 && reserveShare < 100 && <div className="w-0.5 shrink-0 bg-content-strong" />}
              {reserveShare < 100 && <div className="flex flex-1 items-center justify-center bg-chart-2">{100 - reserveShare >= 8 ? `${100 - reserveShare}%` : ""}</div>}
            </div>
          ) : (
            <div aria-hidden className="mt-2 h-6 rounded-md bg-surface" />
          )}
          <p className="mt-1.5 flex justify-between gap-3 text-[11px] text-content-subtle">
            <span className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-primary" />Reserva</span>
            <span className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-chart-2" />Carteira</span>
          </p>
          {bank?.exceedsTotal ? <p role="status" className="mt-2 text-xs text-destructive">O total investido ficou abaixo da reserva definida, então a reserva mostra o total. Ajuste o valor.</p> : null}
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
                <dd className={cn("mt-1 text-[15px] font-semibold text-content-strong", stat.className)}>{stat.value}</dd>
                <p className="mt-0.5 text-[11px] text-content-subtle">{stat.hint}</p>
              </div>
            ))}
          </dl>
        </section>
        <InvestmentClassDistribution
          title="Distribuição por classe"
          description={bank ? "Alocação da carteira · reserva descontada primeiro da renda fixa" : "Alocação da carteira · reserva excluída desta distribuição"}
          items={[...overview.distribution].sort((left, right) => right.amountCents - left.amountCents)}
          emptyMessage="Cadastre ativos na carteira para ver a distribuição."
          illustrationSrc="/images/expenses-pie.webp"
        />
      </div>
      <section aria-label="Atalhos de investimentos" className="grid gap-6 min-[100.0625rem]:gap-5 md:grid-cols-2">
        <InvestmentOverviewLink href="/reserve" illustrationSrc="/images/balance-wallet.webp" title="Reserva" detail={bank ? "Valor do banco, rentabilidade real e projeção" : overview.reserve.configured ? "Saldo estimado, aportes e projeção" : "Configure o saldo em Configurações › Investimentos"} valueCents={overview.reserve.amountCents} action="Acompanhar reserva" />
        <InvestmentOverviewLink href="/investments/portfolio" illustrationSrc="/images/reports-growth-bars.webp" title="Carteira" detail="Posições, cotações e resultado por ativo" valueCents={overview.portfolioCents} action="Ver posições" />
      </section>
    </div>
  );
}
