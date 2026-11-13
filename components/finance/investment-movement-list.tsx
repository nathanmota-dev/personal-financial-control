"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { InvestmentMovementListRow } from "@/components/finance/investment-movement-list-row";
import type { InvestmentMovementListProps } from "@/lib/interfaces/investments";
import { monthsWithMovements } from "@/lib/utils/components/investment-movement-list";

export function InvestmentMovementList({ history }: InvestmentMovementListProps) {
  const months = monthsWithMovements(history);
  return (
    <section aria-label="Aportes e resgates por mês" className="relative flex h-full min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/reports-clipboard.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Aportes e resgates por mês</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Os mesmos aportes e resgates do gráfico, do mês mais recente para o mais antigo</p>
      <p className="mt-5 flex gap-4 text-[11px] text-content">
        <span className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-chart-1" />Aportado</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-chart-2" />Resgatado</span>
      </p>
      {months.length ? (
        <div className="relative mt-2 min-h-[280px] flex-1">
          <ul className="absolute inset-0 divide-y divide-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {months.map((point) => <InvestmentMovementListRow key={point.month} point={point} />)}
          </ul>
        </div>
      ) : (
        <div className="mt-4"><FinanceEmptyState title="Nenhuma movimentação" description="Os aportes e resgates lançados aparecem aqui, mês a mês." /></div>
      )}
    </section>
  );
}
