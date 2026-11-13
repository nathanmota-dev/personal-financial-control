"use client";

import { CheckCircle2, Clock3, Pencil } from "lucide-react";

import { CategoryChip } from "@/components/finance/ds/category-chip";
import { ToneChip } from "@/components/finance/ds/tone-chip";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import {
  PauseRecurringButton,
  RecurringDeleteDialog,
  ResumeRecurringButton,
} from "@/components/finance/recurring-actions";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { Button } from "@/components/ui/button";
import { formatBillDay } from "@/lib/dashboard-bills";
import { formatMonthLabel, recurringStatusLabels } from "@/lib/finance-ui";
import type { RecurringCardProps } from "@/lib/interfaces/recurring";
import { cn } from "@/lib/utils";

const statusTones = { active: "success", paused: "warning", ended: "neutral" } as const;

export function RecurringCard({ template, accounts, categories, month }: RecurringCardProps) {
  const { formatCurrency } = useFinancialFormatter();
  const generated = template.lastGeneratedMonth === month;
  const inactive = template.status !== "active";
  return (
    <li
      aria-label={template.description}
      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3.5 md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1.3fr)_minmax(7rem,auto)_auto] md:gap-x-4"
    >
      <span className={cn("flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-surface leading-none text-content-strong", inactive && "opacity-60")}>
        <span className="text-[9px] font-semibold tracking-wider text-content-subtle uppercase">Dia</span>
        <span className="mt-0.5 text-sm font-semibold tabular-nums">{formatBillDay(template.dayOfMonth)}</span>
      </span>
      <div className={cn("min-w-0", inactive && "opacity-70")}>
        <h3 data-user-content className="truncate text-[13px] font-semibold text-content-strong">{template.description}</h3>
        <p className="truncate text-xs text-content-muted">
          <span data-user-content>{template.account?.name ?? "—"}</span> · desde {formatMonthLabel(template.startMonth)}
          {template.endMonth ? ` até ${formatMonthLabel(template.endMonth)}` : ""}
        </p>
        <p className={cn("mt-0.5 flex items-center gap-1 text-[11px]", generated ? "text-success" : "text-content-subtle")}>
          {generated ? <CheckCircle2 className="size-3 shrink-0" aria-hidden="true" /> : <Clock3 className="size-3 shrink-0" aria-hidden="true" />}
          {generated ? `Lançado em ${formatMonthLabel(month)}` : `Sem lançamento em ${formatMonthLabel(month)}`}
        </p>
      </div>
      <p className={cn("text-right text-[13px] font-semibold whitespace-nowrap tabular-nums text-content-strong md:order-4", inactive && "opacity-70")}>
        {formatCurrency(template.amountCents)}
      </p>
      <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-1.5 md:order-3 md:col-start-auto">
        <CategoryChip name={template.category?.name} />
        <ToneChip tone={statusTones[template.status] ?? "neutral"} dot>{recurringStatusLabels[template.status]}</ToneChip>
      </div>
      <div className="col-start-3 flex justify-end gap-1 md:order-5 md:col-start-auto">
        <RecurringDialog
          accounts={accounts}
          categories={categories}
          month={month}
          template={template}
          trigger={<Button variant="ghost" size="icon-sm" aria-label="Editar" title="Editar"><Pencil className="size-4" /></Button>}
        />
        {template.status === "active" ? <PauseRecurringButton id={template.id} /> : template.status === "paused" ? <ResumeRecurringButton id={template.id} /> : null}
        <RecurringDeleteDialog id={template.id} />
      </div>
    </li>
  );
}
