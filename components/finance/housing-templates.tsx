"use client";

import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatBillDay } from "@/lib/dashboard-bills";
import type { HousingTemplatesProps } from "@/lib/interfaces/housing";

export function HousingTemplates({ templates }: HousingTemplatesProps) {
  const { formatCurrency } = useFinancialFormatter();
  const totalCents = templates.reduce((sum, template) => sum + template.amountCents, 0);
  return (
    <section className="min-w-0 rounded-[20px] border border-border bg-card p-[23px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-content-strong">Contas fixas da casa</h2>
        {templates.length > 0 && <span className="text-xs text-content">{`${formatCurrency(totalCents)} por mês`}</span>}
      </div>
      <p className="mt-1 text-xs text-content">Recorrências ativas de moradia, por dia de vencimento</p>
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
