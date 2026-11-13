"use client";

import { Coins, Layers, TrendingDown, TrendingUp, Trophy } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { OperationalPortfolioHeroProps } from "@/lib/interfaces/investment-operations";
import { cn } from "@/lib/utils";

export function OperationalPortfolioHero({ positions }: OperationalPortfolioHeroProps) {
  const { formatCurrency, protectText } = useFinancialFormatter();
  const total = positions.reduce((sum, item) => sum + item.currentValueCents, 0);
  const known = positions.filter((item) => item.resultCents !== null);
  const result = known.reduce((sum, item) => sum + (item.resultCents ?? 0), 0);
  const largest = positions.reduce<(typeof positions)[number] | null>((top, item) => !top || item.currentValueCents > top.currentValueCents ? item : top, null);
  const ResultIcon = result >= 0 ? TrendingUp : TrendingDown;
  const stats = [
    { label: "Posições", value: String(positions.length), hint: "Ativos na carteira", icon: Layers },
    { label: "Resultado conhecido", value: formatCurrency(result), hint: `${known.length} posição(ões) com custo`, icon: ResultIcon, className: known.length ? (result < 0 ? "text-destructive" : "text-success") : undefined },
    { label: "Maior posição", value: largest ? <span data-user-content>{largest.ticker ?? largest.name}</span> : "—", hint: largest ? `${protectText(largest.participationPercentage.toFixed(1).replace(".", ","))}% da carteira` : "Sem ativos", icon: Trophy },
    { label: "Classes", value: String(new Set(positions.map((item) => item.assetClass)).size), hint: "Diversificação atual", icon: Coins },
  ];
  return (
    <section aria-label="Total na carteira" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src="/images/investments-chart.webp" className="top-4 right-6 size-[96px]" />
      <h2 className="text-sm font-semibold text-content-strong">Total na carteira</h2>
      <DashboardCardsMoney cents={total} className="mt-4 block text-[48px] leading-[52px] font-bold text-content-strong" />
      <p className="mt-2 pr-24 text-xs text-content">Valor atual das posições acompanhadas por operações. A reserva fica fora desta visão.</p>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
            <dd className={cn("mt-1 truncate text-[15px] font-semibold text-content-strong", stat.className)}>{stat.value}</dd>
            <p className="mt-0.5 text-[11px] text-content-subtle">{stat.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
