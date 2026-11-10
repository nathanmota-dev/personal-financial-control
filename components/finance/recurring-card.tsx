"use client";

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
import { Card } from "@/components/ui/card";
import { toneClass, toneForKey, toneForTransactionType } from "@/lib/finance-tone";
import { formatMonthLabel, recurringStatusLabels } from "@/lib/finance-ui";
import type { RecurringCardProps } from "@/lib/interfaces/recurring";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, Pencil } from "lucide-react";

const statusTones = { active: "success", paused: "warning", ended: "neutral" } as const;

export function RecurringCard({ template, accounts, categories, month }: RecurringCardProps) {
  const { formatCurrency } = useFinancialFormatter();
  const generated = template.lastGeneratedMonth === month;
  const tone = template.category ? toneForKey(template.category.name) : toneForTransactionType(template.type);
  return (
    <Card className={cn("grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-2xl p-4 transition-colors hover:border-content-subtle/40 lg:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_auto_auto]", template.status !== "active" && "opacity-80")}>
      <div className={cn("tone-soft flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl leading-none", toneClass(tone))}>
        <span className="text-[9px] font-semibold tracking-[0.08em] uppercase opacity-80">Dia</span>
        <span className="text-lg font-semibold tabular-nums">{template.dayOfMonth}</span>
      </div>
      <div className="min-w-0">
        <h3 data-user-content className="truncate text-sm leading-5 font-semibold text-content-strong">{template.description}</h3>
        <p className="truncate text-xs text-content-muted">
          Mensal · <span data-user-content>{template.account?.name ?? "—"}</span> · desde {formatMonthLabel(template.startMonth)}
          {template.endMonth ? ` até ${formatMonthLabel(template.endMonth)}` : ""}
        </p>
        <p className={cn("mt-1 flex items-center gap-1.5 text-[11px] leading-4", generated ? "text-success" : "text-content-muted")}>
          {generated ? <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" /> : <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />}
          {generated ? `Lançamento gerado em ${formatMonthLabel(month)}.` : `Sem lançamento em ${formatMonthLabel(month)}.`}
        </p>
      </div>
      <p className="text-right text-base font-semibold whitespace-nowrap tabular-nums lg:order-4">{formatCurrency(template.amountCents)}</p>
      <div className="col-span-3 flex flex-wrap items-center gap-1.5 lg:col-span-1">
        <CategoryChip name={template.category?.name} />
        <ToneChip tone={statusTones[template.status] ?? "neutral"} dot>{recurringStatusLabels[template.status]}</ToneChip>
      </div>
      <div className="col-span-3 flex flex-wrap items-center gap-1 border-t border-border pt-3 lg:order-5 lg:col-span-1 lg:border-0 lg:pt-0">
        <RecurringDialog
          accounts={accounts}
          categories={categories}
          month={month}
          template={template}
          trigger={<Button variant="ghost" size="sm"><Pencil className="size-4" />Editar</Button>}
        />
        {template.status === "active" ? <PauseRecurringButton id={template.id} /> : template.status === "paused" ? <ResumeRecurringButton id={template.id} /> : null}
        <RecurringDeleteDialog id={template.id} />
      </div>
    </Card>
  );
}
