"use client";

import { IconTile } from "@/components/finance/ds/icon-tile";
import { Meter } from "@/components/finance/ds/meter";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toneForAssetClass } from "@/lib/finance-tone";
import { investmentAssetClassLabels } from "@/lib/finance-ui";
import type { InvestmentPositionRowProps } from "@/lib/interfaces/investment-operations";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function InvestmentPositionRow({ item }: InvestmentPositionRowProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const tone = toneForAssetClass(item.assetClass);
  return (
    <Link href={`/investments/assets/${item.id}`} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-muted/50 sm:px-6 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,.7fr)_minmax(0,.7fr)_minmax(0,.7fr)_auto]">
      <IconTile tone={tone} size="lg" className="text-[11px] tracking-tight">{(item.ticker ?? item.name).slice(0, 4).toUpperCase()}</IconTile>
      <div className="min-w-0">
        <strong data-user-content className="block truncate text-sm font-semibold text-content-strong">{item.name}</strong>
        <p className="mt-0.5 truncate text-xs text-content-muted">{item.ticker ? <span data-user-content>{item.ticker}</span> : "Sem código"} · {item.institutionName ? <span data-user-content>{item.institutionName}</span> : "Instituição não informada"}</p>
        <ToneChip tone={tone} className="mt-1.5 h-5 px-1.5 text-[11px]">{investmentAssetClassLabels[item.assetClass]}</ToneChip>
      </div>
      <ArrowRight aria-hidden="true" className="size-4 text-content-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand md:order-6" />
      <div className="col-start-2 md:col-start-auto"><p className="text-[11px] text-content-muted">Valor atual</p><p className="text-sm font-semibold tabular-nums">{formatCurrency(item.currentValueCents)}</p></div>
      <div className="col-start-2 md:col-start-auto"><p className="text-[11px] text-content-muted">Resultado</p><p className={item.resultCents === null ? "text-sm text-content-muted" : item.resultCents >= 0 ? "text-sm font-medium text-success" : "text-sm font-medium text-danger"}>{item.resultCents === null ? "Custo não informado" : formatCurrency(item.resultCents)}</p></div>
      <div className="col-start-2 md:col-start-auto"><p className="text-[11px] text-content-muted">Participação</p><p className="text-sm tabular-nums">{item.participationPercentage.toFixed(1)}%</p><Meter className="mt-1.5 max-w-28" size="sm" tone={tone} value={hidden ? 0 : item.participationPercentage} /></div>
    </Link>
  );
}
