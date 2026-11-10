"use client";

import { HeroPanel } from "@/components/finance/ds/hero-panel";
import { HeroStat } from "@/components/finance/ds/hero-stat";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel, investmentAssetClassLabels } from "@/lib/finance-ui";
import type { InvestmentAssetHeroProps } from "@/lib/interfaces/investment-operations";
import { Coins, History, ReceiptText, Tag, TrendingDown, TrendingUp } from "lucide-react";

export function InvestmentAssetHero({ asset }: InvestmentAssetHeroProps) {
  const { formatCurrency, protect, hidden } = useFinancialFormatter();
  const negative = asset.resultCents !== null && asset.resultCents < 0;
  const ResultIcon = negative ? TrendingDown : TrendingUp;
  const cost = asset.position?.costCents ?? 0;
  const resultPercent = asset.resultCents !== null && cost > 0 ? (asset.resultCents / cost) * 100 : null;
  return (
    <HeroPanel
      eyebrow="Valor atual"
      value={formatCurrency(asset.currentValueCents)}
      caption={`Posição atualizada em ${formatDateLabel(asset.valueAsOf)}.`}
      badge={<span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">{investmentAssetClassLabels[asset.assetClass]}</span>}
      aside={
        <div className="flex w-full flex-col justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/80"><ResultIcon aria-hidden="true" className="size-3.5" />Resultado nominal</p>
          <p className={`text-[28px] leading-8 font-semibold tracking-tight break-words tabular-nums ${negative ? "text-rose-100" : ""}`}>{asset.resultCents === null ? "Desconhecido" : formatCurrency(asset.resultCents)}</p>
          <p className="text-[11px] leading-4 text-white/70">{resultPercent === null || hidden ? "Registre operações para conhecer custo e resultado." : `${resultPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% sobre o custo conhecido.`}</p>
        </div>
      }
    >
      <HeroStat label="Quantidade" value={protect(asset.position?.quantity ?? "Desconhecida")} icon={<Coins />} />
      <HeroStat label="Custo" value={asset.position ? formatCurrency(asset.position.costCents) : "Desconhecido"} icon={<ReceiptText />} />
      <HeroStat label="Preço médio" value={asset.position?.averagePriceCents ? formatCurrency(asset.position.averagePriceCents) : "—"} icon={<Tag />} />
      <HeroStat label="Operações" value={String(asset.operations.length)} hint="No histórico do ativo" icon={<History />} />
    </HeroPanel>
  );
}
