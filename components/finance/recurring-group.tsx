"use client";

import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { RecurringCard } from "@/components/finance/recurring-card";
import { Badge } from "@/components/ui/badge";
import type { RecurringGroupProps } from "@/lib/interfaces/recurring";

export function RecurringGroup({ title, description, templates, ...cardProps }: RecurringGroupProps) {
  const { formatCurrency } = useFinancialFormatter();
  const total = templates.filter((item) => item.status === "active").reduce((sum, item) => sum + item.amountCents, 0);
  return (
    <section aria-label={title} className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold leading-[25px]">{title}</h2>
            <Badge variant="outline" className="border-input text-content">{templates.length}</Badge>
          </div>
          <p className="mt-1 text-xs text-content-muted">{description}</p>
        </div>
        <p className="text-right">
          <span className="block text-xl font-semibold tabular-nums text-content-strong">{formatCurrency(total)}</span>
          <span className="block text-[11px] text-content-subtle">ativas por mês</span>
        </p>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {templates.map((template) => <RecurringCard key={template.id} template={template} {...cardProps} />)}
      </ul>
    </section>
  );
}
