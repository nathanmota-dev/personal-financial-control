"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import type { HousingEntriesProps } from "@/lib/interfaces/housing";

export function HousingEntries({ entries }: HousingEntriesProps) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/housing-receipt.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Lançamentos da casa</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Despesas de moradia registradas no mês</p>
      {entries.length ? (
        <ul className="mt-4 divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 py-3.5 text-[13px]">
              <span className="w-[84px] shrink-0 text-xs text-content">{formatDateLabel(entry.date)}</span>
              <span data-user-content className="min-w-0 flex-1 truncate text-content-strong">{entry.description}</span>
              {entry.accountName && <span data-user-content className="hidden truncate text-xs text-content sm:block sm:max-w-40">{entry.accountName}</span>}
              <span className="shrink-0 font-semibold text-content-strong">{formatCurrency(entry.amountCents)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <FinanceEmptyState title="Nenhum lançamento da casa" description="Use “Novo item da casa” para registrar aluguel, condomínio, luz e outras contas." />
        </div>
      )}
    </section>
  );
}
