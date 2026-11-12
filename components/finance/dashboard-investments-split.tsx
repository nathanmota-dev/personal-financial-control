"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { DashboardInvestmentsSplitProps } from "@/lib/interfaces/dashboard-investments";

export function DashboardInvestmentsSplit({ reserveCents, portfolioCents, reservePercent, portfolioPercent }: DashboardInvestmentsSplitProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <div data-testid="investments-split">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-content"><span className="size-1.5 rounded-full bg-primary" aria-hidden />Reserva</p>
          <p className="text-sm font-semibold text-content-strong">{formatCurrency(reserveCents)}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="flex items-center justify-end gap-1.5 text-xs text-content">Carteira<span className="size-1.5 rounded-full bg-[#ff3b6b]" aria-hidden /></p>
          <p className="text-sm font-semibold text-content-strong">{formatCurrency(portfolioCents)}</p>
        </div>
      </div>
      <div className="relative mt-2 flex h-6 overflow-hidden rounded-md bg-surface text-[11px] font-semibold text-white">
        {reservePercent > 0 && <div className="flex items-center bg-primary px-2.5" style={{ width: `${reservePercent}%` }}>{`${reservePercent}%`}</div>}
        {portfolioPercent > 0 && <div className="flex items-center justify-end bg-[#ff3b6b] px-2.5" style={{ width: `${portfolioPercent}%` }}>{`${portfolioPercent}%`}</div>}
        {reservePercent > 0 && portfolioPercent > 0 && <span aria-hidden className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-black" style={{ left: `${reservePercent}%` }} />}
      </div>
    </div>
  );
}
