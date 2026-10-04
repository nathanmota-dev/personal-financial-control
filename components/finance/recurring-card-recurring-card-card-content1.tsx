"use client";

import {
CardContent
} from "@/components/ui/card";
import {
formatCurrency,
formatMonthLabel
} from "@/lib/finance-ui";
import type { RecurringCardCardContent1Props } from "@/lib/interfaces/render/recurring-card-recurring-card-card-content1";
import { cn } from "@/lib/utils";
import {
CalendarDays,
CheckCircle2,
Clock3
} from "lucide-react";

export function RecurringCardCardContent1({ template, generated, month }: RecurringCardCardContent1Props) {
  return (
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
  );
}
