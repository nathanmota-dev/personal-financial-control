"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
  Repeat2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { StatusDotBadge } from "@/components/finance/status-dot-badge";
import { Button } from "@/components/ui/button";
import {
  PauseRecurringButton,
  RecurringDeleteDialog,
  ResumeRecurringButton,
} from "@/components/finance/recurring-actions";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import type { RecurringCardProps } from "@/lib/interfaces/recurring";
import {
  formatCurrency,
  formatMonthLabel,
  getStatusTone,
  recurringStatusLabels,
  transactionTypeLabels,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

export function RecurringCard({
  template,
  accounts,
  categories,
  month,
}: RecurringCardProps) {
  const generated = template.lastGeneratedMonth === month;

  return (
    <Card className="h-full min-w-0 gap-5">
      <CardHeader className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Repeat2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold leading-snug text-content-strong">
            {template.description}
          </h3>
          <p className="mt-1 text-xs text-content">
            {transactionTypeLabels[template.type]} · Mensal
          </p>
        </div>
        <StatusDotBadge tone={getStatusTone(template.status)}>
          {recurringStatusLabels[template.status]}
        </StatusDotBadge>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs text-content">Valor mensal</p>
            <p className="break-all text-[27px] font-semibold tracking-tight text-content-strong tabular-nums">
              {formatCurrency(template.amountCents)}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-content-strong">
            <CalendarDays className="size-4 text-content" aria-hidden="true" />
            Dia {template.dayOfMonth}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-content">Conta</dt>
            <dd className="mt-1 break-words text-content-strong">
              {template.account?.name ?? "—"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-content">Categoria</dt>
            <dd className="mt-1 break-words text-content-strong">
              {template.category?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-content">Início</dt>
            <dd className="mt-1 text-content-strong">
              {formatMonthLabel(template.startMonth)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-content">Término</dt>
            <dd className="mt-1 text-content-strong">
              {template.endMonth
                ? formatMonthLabel(template.endMonth)
                : "Sem data final"}
            </dd>
          </div>
        </dl>
        <p
          className={cn(
            "flex items-start gap-2 text-xs leading-5",
            generated ? "text-success" : "text-content",
          )}
        >
          {generated ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          {generated
            ? `Lançamento gerado em ${formatMonthLabel(month)}.`
            : `Sem lançamento em ${formatMonthLabel(month)}.`}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2">
        <RecurringDialog
          accounts={accounts}
          categories={categories}
          month={month}
          template={template}
          trigger={
            <Button variant="outline">
              <Pencil className="size-4" />
              Editar
            </Button>
          }
        />
        {template.status === "active" ? (
          <PauseRecurringButton id={template.id} />
        ) : template.status === "paused" ? (
          <ResumeRecurringButton id={template.id} />
        ) : null}
        <div className="ml-auto">
          <RecurringDeleteDialog id={template.id} />
        </div>
      </CardFooter>
    </Card>
  );
}
