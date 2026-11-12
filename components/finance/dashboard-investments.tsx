"use client";

import Image from "next/image";
import Link from "next/link";

import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { DashboardInvestmentsItems } from "@/components/finance/dashboard-investments-items";
import { DashboardInvestmentsSplit } from "@/components/finance/dashboard-investments-split";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { buildDashboardInvestments } from "@/lib/dashboard-investments";
import type { DashboardInvestmentsProps } from "@/lib/interfaces/dashboard-investments";
import { cn } from "@/lib/utils";

export function DashboardInvestments({ overview, href }: DashboardInvestmentsProps) {
  const { formatCurrency } = useFinancialFormatter();
  const data = buildDashboardInvestments(overview);
  if (!data.items.length) {
    return (
      <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px]">
        <h2 className="text-sm font-semibold text-content-strong">Investimentos</h2>
        <div className="mt-4">
          <FinanceEmptyState title="Nenhum investimento" description="Reserva de emergência e carteira de longo prazo aparecem aqui." />
        </div>
      </section>
    );
  }
  return (
    <section className="@container flex min-w-0 flex-col rounded-[20px] border border-border bg-card p-[23px]">
      <h2 className="text-sm font-semibold text-content-strong">Investimentos</h2>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-content">Total investido</p>
          <DashboardCardsMoney cents={data.totalCents} className="mt-1 block text-[40px] leading-[44px] font-bold text-content-strong" />
        </div>
        <div aria-hidden className="relative -my-5 mr-8 size-[72px] shrink-0 -translate-y-1.5">
          <div className="absolute inset-x-2 -bottom-1 h-4 rounded-[50%] bg-black/50 blur-[7px]" />
          <Image src="/images/investments-chart.webp" width={230} height={288} alt="" unoptimized className="relative size-full object-contain" />
        </div>
      </div>
      <div className="mt-5">
        <DashboardInvestmentsSplit reserveCents={data.reserveCents} portfolioCents={data.portfolioCents} reservePercent={data.reservePercent} portfolioPercent={data.portfolioPercent} />
      </div>
      <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">Onde está o dinheiro</p>
      <DashboardInvestmentsItems items={data.items} />
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-content">
        <span>
          Resultado da carteira{" "}
          <span className={cn("font-bold", data.resultCents < 0 ? "text-destructive" : "text-success")}>{formatCurrency(data.resultCents)}</span>
        </span>
        {href && <Link href={href} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-content-strong transition-colors hover:bg-surface">Ver investimentos</Link>}
      </div>
    </section>
  );
}
