"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { IconTile } from "@/components/finance/ds/icon-tile";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { toneForAssetClass } from "@/lib/finance-tone";
import { investmentAssetClassLabels } from "@/lib/finance-ui";
import type { InvestmentPositionRowProps } from "@/lib/interfaces/investment-operations";
import { cn } from "@/lib/utils";

export function InvestmentPositionRow({ item }: InvestmentPositionRowProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const tone = toneForAssetClass(item.assetClass);
  return (
    <li>
      <Link href={`/investments/assets/${item.id}`} className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-[22px] py-3.5 transition-colors hover:bg-muted/40 md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] md:gap-x-4">
        <IconTile tone={tone} className="text-[10px] tracking-tight">{(item.ticker ?? item.name).slice(0, 4).toUpperCase()}</IconTile>
        <div className="min-w-0">
          <strong data-user-content className="block truncate text-[13px] font-semibold text-content-strong">{item.name}</strong>
          <p className="truncate text-xs text-content-muted">{item.ticker ? <span data-user-content>{item.ticker}</span> : "Sem código"} · {item.institutionName ? <span data-user-content>{item.institutionName}</span> : "Instituição não informada"}</p>
        </div>
        <ChevronRight aria-hidden="true" className="size-4 text-content-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:order-6" />
        <div className="col-start-2 md:col-start-auto"><ToneChip tone={tone}>{investmentAssetClassLabels[item.assetClass]}</ToneChip></div>
        <div className="col-start-2 md:col-start-auto md:text-right">
          <p className="text-[11px] text-content-muted">Valor atual</p>
          <p className="text-[13px] font-semibold tabular-nums text-content-strong">{formatCurrency(item.currentValueCents)}</p>
        </div>
        <div className="col-start-2 md:col-start-auto md:text-right">
          <p className="text-[11px] text-content-muted">{`Resultado · ${hidden ? "—" : `${item.participationPercentage.toFixed(1).replace(".", ",")}% da carteira`}`}</p>
          <p className={cn("text-[13px] tabular-nums", item.resultCents === null ? "text-content-muted" : item.resultCents >= 0 ? "font-semibold text-success" : "font-semibold text-destructive")}>
            {item.resultCents === null ? "Custo não informado" : formatCurrency(item.resultCents)}
          </p>
        </div>
      </Link>
    </li>
  );
}
