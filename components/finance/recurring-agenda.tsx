"use client";

import { CheckCircle2, Clock3 } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatBillDay } from "@/lib/dashboard-bills";
import { formatMonthLabel, transactionTypeLabels } from "@/lib/finance-ui";
import type { RecurringAgendaProps } from "@/lib/interfaces/recurring";
import { buildRecurringAgenda } from "@/lib/recurring-summary";
import { cn } from "@/lib/utils";

const typeSigns = { income: "+", expense: "−", investment_contribution: "", investment_withdrawal: "" };

export function RecurringAgenda({ month, templates }: RecurringAgendaProps) {
  const { formatCurrency } = useFinancialFormatter();
  const agenda = buildRecurringAgenda(templates, month);
  const generated = agenda.filter((template) => template.lastGeneratedMonth === month).length;
  return (
    <section className="relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/bills-calendar.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Agenda do mês</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">{`Recorrências ativas em ${formatMonthLabel(month)}, por dia`}</p>
      {agenda.length ? (
        <>
          <p className="mt-5 text-[10px] font-bold tracking-wider text-content uppercase">{`${generated} de ${agenda.length} lançadas`}</p>
          <ul className="mt-2 max-h-[300px] divide-y divide-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {agenda.map((template) => {
              const isGenerated = template.lastGeneratedMonth === month;
              const StatusIcon = isGenerated ? CheckCircle2 : Clock3;
              return (
                <li key={template.id} className="flex items-center gap-3 py-3 text-[13px]">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-semibold text-content-strong">{formatBillDay(template.dayOfMonth)}</span>
                  <span className="min-w-0 flex-1">
                    <span data-user-content className="block truncate text-content-strong">{template.description}</span>
                    <span className="block text-[11px] text-content-subtle">{transactionTypeLabels[template.type]}</span>
                  </span>
                  <span className={cn("shrink-0 font-semibold tabular-nums", template.type === "income" ? "text-success" : "text-content-strong")}>
                    {typeSigns[template.type]}{formatCurrency(template.amountCents)}
                  </span>
                  <StatusIcon aria-label={isGenerated ? "Lançamento gerado" : "Ainda não lançado"} className={cn("size-4 shrink-0", isGenerated ? "text-success" : "text-content-subtle")} />
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="mt-4">
          <FinanceEmptyState title="Agenda vazia" description="Nenhuma recorrência ativa está prevista para este mês." />
        </div>
      )}
    </section>
  );
}
