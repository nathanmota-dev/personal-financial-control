"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { ALLOCATION_TYPE_LABELS } from "../goals-constants";
import type { RecentAllocationsCardProps } from "../goals-types";

export function RecentAllocationsCard({ dashboard }: RecentAllocationsCardProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/reports-clipboard.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Histórico recente</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Últimos movimentos vinculados às metas atuais</p>
      {dashboard.recentAllocations.length ? (
        <ul className="mt-4 max-h-[420px] divide-y divide-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dashboard.recentAllocations.map((allocation) => (
            <li key={allocation.id} className="flex items-center gap-3 py-3.5 text-[13px]">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: allocation.goalColor }} />
              <span className="min-w-0 flex-1">
                <span data-user-content className="block truncate font-semibold text-content-strong">{allocation.goalName}</span>
                <span className="block text-xs text-content-muted">{`${ALLOCATION_TYPE_LABELS[allocation.type]} · ${formatDateLabel(allocation.occurredOn)}`}</span>
              </span>
              <span className={cn("shrink-0 font-semibold tabular-nums", allocation.amountCents >= 0 ? "text-content-strong" : "text-destructive")}>
                {formatCurrency(allocation.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <FinanceEmptyState
            title="Sem movimentações"
            description="Alocações, liberações e aportes vinculados às metas aparecerão nesta lista."
          />
        </div>
      )}
    </section>
  );
}
