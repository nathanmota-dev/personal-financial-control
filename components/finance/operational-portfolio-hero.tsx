"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { rankShares } from "@/lib/finance-tone";
import { investmentAssetClassLabels } from "@/lib/finance-ui";
import type { OperationalPortfolioHeroProps } from "@/lib/interfaces/investment-operations";
import { Coins, Layers, Trophy, TrendingUp } from "lucide-react";

export function OperationalPortfolioHero({ positions }: OperationalPortfolioHeroProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const total = positions.reduce((sum, item) => sum + item.currentValueCents, 0);
  const known = positions.filter((item) => item.resultCents !== null);
  const result = known.reduce((sum, item) => sum + (item.resultCents ?? 0), 0);
  const largest = positions.reduce<(typeof positions)[number] | null>((top, item) => !top || item.currentValueCents > top.currentValueCents ? item : top, null);
  const shares = rankShares(positions, (item) => investmentAssetClassLabels[item.assetClass], (item) => item.currentValueCents);
  return (
    <HeroPanel
      eyebrow="Total em longo prazo"
      value={formatCurrency(total)}
      caption="Valor atual das posições acompanhadas por operações."
      aside={
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-xs font-semibold text-white/80">Alocação por classe</p>
          {shares.length ? shares.map((share) => (
            <div key={share.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium">{share.name}</span><span className="shrink-0 text-white/75 tabular-nums">{hidden ? "" : `${share.percent.toFixed(0)}%`}</span></div>
              <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-white/85" style={{ width: hidden ? 0 : `${share.percent}%` }} /></div>
            </div>
          )) : <p className="text-xs leading-5 text-white/70">Cadastre um ativo para ver a alocação por classe.</p>}
        </div>
      }
    >
      <HeroStat label="Posições" value={String(positions.length)} hint="Ativos na carteira" icon={<Layers />} />
      <HeroStat label="Resultado conhecido" value={formatCurrency(result)} hint={`${known.length} posição(ões) com custo`} icon={<TrendingUp />} />
      <HeroStat label="Maior posição" value={largest ? <span data-user-content>{largest.ticker ?? largest.name}</span> : "—"} hint={largest ? `${largest.participationPercentage.toFixed(1)}% da carteira` : "Sem ativos"} icon={<Trophy />} />
      <HeroStat label="Classes" value={String(new Set(positions.map((item) => item.assetClass)).size)} hint="Diversificação atual" icon={<Coins />} />
    </HeroPanel>
  );
}
