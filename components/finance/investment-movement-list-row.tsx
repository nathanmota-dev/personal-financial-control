"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { InvestmentMovementListRowProps } from "@/lib/interfaces/investments";

export function InvestmentMovementListRow({ point }: InvestmentMovementListRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const netCents = point.monthlyContributionCents - point.monthlyWithdrawalCents;
  return (
    <li className="flex items-start justify-between gap-4 py-3 text-[13px]">
      <div className="min-w-0">
        <p className="font-semibold text-content-strong capitalize">{formatMonthLabel(point.month)}</p>
        <p className="mt-0.5 text-[11px] text-content-subtle">Líquido {formatCurrency(netCents)}</p>
      </div>
      <dl className="shrink-0 space-y-1 text-right tabular-nums">
        <div className="flex items-center justify-end gap-1.5">
          <dt className="sr-only">Aportado</dt>
          <span aria-hidden className="size-2 rounded-full bg-chart-1" />
          <dd className="font-semibold text-content-strong">{formatCurrency(point.monthlyContributionCents)}</dd>
        </div>
        {point.monthlyWithdrawalCents > 0 ? (
          <div className="flex items-center justify-end gap-1.5 text-xs">
            <dt className="sr-only">Resgatado</dt>
            <span aria-hidden className="size-2 rounded-full bg-chart-2" />
            <dd className="text-content">− {formatCurrency(point.monthlyWithdrawalCents)}</dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}
