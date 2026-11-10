"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { rankShares } from "@/lib/finance-tone";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { TransactionsHeroProps } from "@/lib/interfaces/transactions";
import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

export function TransactionsHero({ month, totals, transactions }: TransactionsHeroProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const result = totals.income - totals.expense;
  const shares = rankShares(
    transactions.filter((item) => item.type === "expense" && item.status !== "cancelled"),
    (item) => item.category?.name ?? null,
    (item) => item.amountCents,
  );
  return (
    <HeroPanel
      eyebrow="Resultado do período"
      value={formatCurrency(result)}
      caption={`Receitas menos despesas de ${formatMonthLabel(month)}, sem lançamentos cancelados.`}
      aside={
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-xs font-semibold text-white/80">Para onde foi o dinheiro</p>
          {shares.length ? (
            shares.map((share) => (
              <div key={share.name ?? "uncategorized"} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium">{share.name ? <span data-user-content>{share.name}</span> : "Sem categoria"}</span>
                  <span className="shrink-0 text-white/75 tabular-nums">{formatCurrency(share.amountCents)}</span>
                </div>
                <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-white/85" style={{ width: hidden ? 0 : `${share.percent}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs leading-5 text-white/70">As maiores categorias de despesa aparecem aqui assim que houver saídas no período.</p>
          )}
        </div>
      }
    >
      <HeroStat label="Receitas" value={formatCurrency(totals.income)} icon={<TrendingUp />} />
      <HeroStat label="Despesas" value={formatCurrency(totals.expense)} icon={<TrendingDown />} />
      <HeroStat label="Aportes" value={formatCurrency(totals.investment)} icon={<ArrowUpRight />} />
      <HeroStat label="Resgates" value={formatCurrency(totals.withdrawal)} icon={<ArrowDownLeft />} />
    </HeroPanel>
  );
}
