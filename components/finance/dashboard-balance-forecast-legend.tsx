"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { DashboardBalanceForecastLegendProps } from "@/lib/interfaces/dashboard-balance-forecast";
import { cn } from "@/lib/utils";

export function DashboardBalanceForecastLegend({ incomeCents, segments }: DashboardBalanceForecastLegendProps) {
  const { formatCurrency, protect } = useFinancialFormatter();
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
      <div>
        <dt className="text-xs text-content">Receitas</dt>
        <dd className="mt-1 text-[15px] font-semibold text-content-strong">{formatCurrency(incomeCents)}</dd>
      </div>
      {segments.map((segment) => (
        <div key={segment.key}>
          <dt className="flex items-center gap-1.5 text-xs text-content">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-full", segment.colorClassName)} />
            {segment.key === "free" ? `= ${segment.label}` : segment.label}
          </dt>
          <dd className="mt-1 text-[15px] font-semibold text-content-strong">
            {segment.key === "free" ? null : "− "}
            {formatCurrency(segment.key === "free" ? segment.amountCents : Math.abs(segment.amountCents))}
            {segment.percent !== null && <span className="ml-1.5 text-[11px] font-normal text-content-subtle">{protect(`${segment.percent}%`)}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
