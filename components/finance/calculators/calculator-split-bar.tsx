"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { CalculatorSplitBarProps } from "@/lib/interfaces/compound-interest";
import { cn } from "@/lib/utils";

/** Segmented bar with a legend, as in the dashboard "Saldo previsto" card. */
export function CalculatorSplitBar({ segments }: CalculatorSplitBarProps) {
  const { formatCurrency, hidden } = useFinancialFormatter();
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.cents, 0), 0);
  return (
    <>
      <div aria-hidden className="mt-6 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">
        {!hidden && total > 0 ? segments.map((segment) => (
          <div key={segment.label} className={cn("h-full rounded-full", segment.colorClassName)} style={{ width: `${(Math.max(segment.cents, 0) / total) * 100}%` }} />
        )) : null}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))]">
        {segments.map((segment) => (
          <div key={segment.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-content"><span aria-hidden className={cn("size-2 shrink-0 rounded-full", segment.colorClassName)} />{segment.label}</dt>
            <dd className="mt-1 text-[15px] font-semibold text-content-strong tabular-nums">{formatCurrency(segment.cents)}</dd>
            <p className="mt-0.5 text-[11px] text-content-subtle">{hidden || total <= 0 ? "—" : `${((Math.max(segment.cents, 0) / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}{segment.hint ? <> · {segment.hint}</> : null}</p>
          </div>
        ))}
      </dl>
    </>
  );
}
