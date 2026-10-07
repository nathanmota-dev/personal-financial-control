"use client";

import type { DashboardPortfolioProps } from "@/lib/interfaces/dashboard";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";

export function DashboardPortfolio({ investmentOverview: overview }: DashboardPortfolioProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6 xl:h-[238px]">
      <h2 className="text-lg font-semibold">Carteira consolidada</h2>
      <p className="mt-1 text-xs text-content-muted">Posição atual dos investimentos</p>
      <div className="mt-[22px]">
        <p className="text-xs text-content-muted">Total investido</p>
        <p className="mt-1 text-[25px] font-[650] tracking-[-0.8px]">{formatCurrency(overview.totalCents)}</p>
      </div>
      <div className="mt-[15px] grid grid-cols-2 gap-2 border-t border-border pt-[13px]">
        <div>
          <p className="text-[11px] text-content-subtle">Reserva de emergência</p>
          <p className="mt-1.5 text-xs font-semibold">{formatCurrency(overview.reserve.amountCents)}</p>
        </div>
        <div>
          <p className="text-[11px] text-content-subtle">Longo prazo</p>
          <p className="mt-1.5 text-xs font-semibold">{formatCurrency(overview.portfolioCents)}</p>
        </div>
      </div>
      {!overview.reserve.configured && overview.portfolioCents === 0 && <p className="mt-3 text-xs text-content-muted">A carteira ainda não foi configurada.</p>}
    </section>
  );
}
