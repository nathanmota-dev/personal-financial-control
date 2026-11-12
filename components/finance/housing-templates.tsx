"use client";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatBillDay } from "@/lib/dashboard-bills";
import type { HousingTemplatesProps } from "@/lib/interfaces/housing";

export function HousingTemplates({ templates }: HousingTemplatesProps) {
  const { formatCurrency } = useFinancialFormatter();
  const totalCents = templates.reduce((sum, template) => sum + template.amountCents, 0);
  return (
    <section className="relative min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/recurring-repeat.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Contas fixas da casa</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">Recorrências ativas de moradia, por dia de vencimento</p>
      {templates.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-content">Total por mês</p>
          <DashboardCardsMoney cents={totalCents} className="mt-1 block text-[40px] leading-[44px] font-bold text-content-strong" />
        </div>
      )}
      {templates.length ? (
        <ul className="mt-3 divide-y divide-border">
          {templates.map((template) => (
            <li key={template.id} className="flex items-center gap-3 py-3.5 text-[13px]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-semibold text-content-strong">{formatBillDay(template.dayOfMonth)}</span>
              <span data-user-content className="min-w-0 flex-1 truncate text-content-strong">{template.description}</span>
              <span className="shrink-0 font-semibold text-content-strong">{formatCurrency(template.amountCents)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <FinanceEmptyState title="Nenhuma conta fixa" description="Use “Nova conta fixa da casa” para cadastrar o que se repete todo mês." />
        </div>
      )}
    </section>
  );
}
