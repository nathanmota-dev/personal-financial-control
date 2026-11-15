"use client";

import { CircleHelp, TrendingDown, TrendingUp } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import { INVESTMENT_ASSET_ILLUSTRATIONS } from "@/lib/investment-asset-illustrations";
import type { InvestmentAssetResultProps } from "@/lib/interfaces/investment-operations";
import { cn } from "@/lib/utils";

export function InvestmentAssetResult({ asset }: InvestmentAssetResultProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const known = asset.resultCents !== null;
  const negative = known && asset.resultCents! < 0;
  const cost = asset.position?.costCents ?? 0;
  const percent = known && cost > 0 ? (asset.resultCents! / cost) * 100 : null;
  const scale = Math.max(cost, asset.currentValueCents);
  // Blue is the part kept from the cost; the rest of the track is the gain (green) or the loss (red).
  const keptShare = scale > 0 ? (Math.min(cost, asset.currentValueCents) / scale) * 100 : 0;
  const StatusIcon = !known ? CircleHelp : negative ? TrendingDown : TrendingUp;
  const quote = asset.quotes[0];
  const rows = [
    { label: "Fonte da valoração", value: quote ? quote.provider : asset.valuationMode === "market_quote" ? "Cotação manual" : "Saldo informado" },
    { label: "Última cotação", value: quote ? formatDateLabel(quote.quotedOn) : "—" },
    { label: "Situação", value: quote?.isStale ? "Desatualizada" : quote ? "Em dia" : "Sem cotação", className: quote?.isStale ? "text-warning" : undefined },
  ];
  return (
    <section data-slot="card" aria-label="Resultado nominal" className="@container relative min-w-0 rounded-[20px] border border-border bg-card p-[23px] min-[100.0625rem]:p-5">
      <DashboardCardIllustration src={INVESTMENT_ASSET_ILLUSTRATIONS.result} className="top-4 right-6 size-[80px]" />
      <h2 className="text-sm font-semibold text-content-strong">Resultado nominal</h2>
      {known ? (
        <DashboardCardsMoney cents={asset.resultCents!} className="mt-4 block text-[40px] leading-[44px] font-bold text-content-strong" />
      ) : (
        <p className="mt-4 pr-24 text-[28px] leading-[36px] font-bold tracking-tight text-content-strong">Desconhecido</p>
      )}
      <p className={cn("mt-3 flex items-center gap-1.5 text-xs", !known ? "text-content" : negative ? "text-destructive" : "text-success")}>
        <StatusIcon aria-hidden className="size-3.5 shrink-0" />
        <span className="font-semibold">{!known ? "Sem custo conhecido" : percent === null || hidden ? "Resultado sobre o custo" : `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% sobre o custo`}</span>
      </p>
      <div aria-hidden className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">
        {known && !hidden ? <>
          <div className="h-full rounded-full bg-primary" style={{ width: `${keptShare}%` }} />
          <div className={cn("h-full flex-1 rounded-full", negative ? "bg-destructive" : "bg-success")} />
        </> : null}
      </div>
      <p className="mt-1.5 flex justify-between gap-3 text-[11px] text-content-subtle">
        <span>{`Custo ${asset.position ? formatCurrency(cost) : "desconhecido"}`}</span>
        <span>{`Atual ${formatCurrency(asset.currentValueCents)}`}</span>
      </p>
      {!known ? <p className="mt-3 text-xs text-content-muted">Registre operações para conhecer custo e resultado.</p> : null}
      <p className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">Cotação</p>
      <dl className="mt-2 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
            <dt className="text-content">{row.label}</dt>
            <dd className={cn("min-w-0 truncate font-semibold text-content-strong", row.className)}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
