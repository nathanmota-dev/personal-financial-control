"use client";

import { SectionCard } from "@/components/finance/ds/section-card";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { RecurringCard } from "@/components/finance/recurring-card";
import { toneForTransactionType } from "@/lib/finance-tone";
import type { RecurringGroupProps } from "@/lib/interfaces/recurring";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";

const icons = { expense: TrendingDown, income: TrendingUp, investment_contribution: ArrowUpRight, investment_withdrawal: ArrowUpRight };

export function RecurringGroup({ title, description, type, templates, ...cardProps }: RecurringGroupProps) {
  const { formatCurrency } = useFinancialFormatter();
  const Icon = icons[type];
  const total = templates.filter((item) => item.status === "active").reduce((sum, item) => sum + item.amountCents, 0);
  return (
    <SectionCard
      title={title}
      description={description}
      count={templates.length}
      icon={<Icon />}
      tone={toneForTransactionType(type)}
      action={<p className="text-sm font-semibold tabular-nums">{formatCurrency(total)}<span className="ml-1 text-xs font-normal text-content-muted">/mês</span></p>}
      contentClassName="grid gap-3"
    >
      {templates.map((template) => <RecurringCard key={template.id} template={template} {...cardProps} />)}
    </SectionCard>
  );
}
