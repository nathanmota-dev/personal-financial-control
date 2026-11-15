"use client";

import { Coins, History, ReceiptText, Tag } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel, investmentAssetClassLabels } from "@/lib/finance-ui";
import { INVESTMENT_ASSET_ILLUSTRATIONS } from "@/lib/investment-asset-illustrations";
import type { InvestmentAssetHeroProps } from "@/lib/interfaces/investment-operations";

export function InvestmentAssetHero({ asset }: InvestmentAssetHeroProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  const stats = [
    { label: "Quantidade", value: protect(asset.position?.quantity ?? "Desconhecida"), hint: "Unidades em carteira", icon: Coins },
    { label: "Custo", value: asset.position ? formatCurrency(asset.position.costCents) : "Desconhecido", hint: "Total aplicado", icon: ReceiptText },
    { label: "Preço médio", value: asset.position?.averagePriceCents ? formatCurrency(asset.position.averagePriceCents) : "—", hint: "Por unidade", icon: Tag },
    { label: "Operações", value: String(asset.operations.length), hint: "No histórico do ativo", icon: History },
  ];
  return (
    <section data-slot="card" aria-label="Valor atual" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src={INVESTMENT_ASSET_ILLUSTRATIONS.hero} className="top-4 right-6 size-[96px]" />
      <div className="flex flex-wrap items-center gap-2 pr-28">
        <h2 className="text-sm font-semibold text-content-strong">Valor atual</h2>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{investmentAssetClassLabels[asset.assetClass]}</span>
      </div>
      <DashboardCardsMoney cents={asset.currentValueCents} className="mt-4 block text-[48px] leading-[52px] font-bold text-content-strong" />
      <p className="mt-2 pr-24 text-xs text-content">{`Posição atualizada em ${formatDateLabel(asset.valueAsOf)}.`}</p>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><stat.icon aria-hidden className="size-3.5 shrink-0" />{stat.label}</dt>
            <dd className="mt-1 truncate text-[15px] font-semibold text-content-strong tabular-nums">{stat.value}</dd>
            <p className="mt-0.5 text-[11px] text-content-subtle">{stat.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
