"use client";

import type {
  DayDetailSheetProps,
  DetailMetricProps,
  EventRowProps,
} from "@/app/interfaces/projected-balance";
import { StatusBadge } from "@/components/finance/projected-balance-components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { eventSourceLabels, eventTypeLabels } from "./labels";

export function DayDetailSheet({ day, onOpenChange }: DayDetailSheetProps) {
  return (
    <Sheet open={Boolean(day)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-slate-800 bg-slate-950 text-slate-100 sm:max-w-xl">
        {day ? (
          <>
            <SheetHeader className="border-b border-slate-800 px-6 py-5 text-left">
              <SheetTitle className="text-xl text-slate-100">
                {formatDateLabel(day.date)}
              </SheetTitle>
              <SheetDescription className="text-slate-400">
                Saldo final de {formatCurrency(day.projectedBalanceCents)}.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-6 pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailMetric
                  label="Saldo inicial"
                  value={formatCurrency(day.startingBalanceCents)}
                />
                <DetailMetric
                  label="Entradas"
                  value={formatCurrency(day.incomeCents + day.transferInCents)}
                  tone="emerald"
                />
                <DetailMetric
                  label="Saídas"
                  value={formatCurrency(day.expenseCents + day.transferOutCents)}
                  tone="rose"
                />
                <DetailMetric
                  label="Investimentos líquidos"
                  value={formatCurrency(day.investmentCents)}
                  tone="sky"
                />
                <DetailMetric
                  label="Cartão"
                  value={formatCurrency(day.creditCardCents)}
                  tone="blue"
                />
                <DetailMetric
                  label="Saldo final"
                  value={formatCurrency(day.projectedBalanceCents)}
                  tone={day.projectedBalanceCents >= 0 ? "cyan" : "rose"}
                />
              </div>

              <div className="rounded-2xl border border-slate-800 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-heading text-base font-semibold text-slate-100">
                    Eventos do dia
                  </h3>
                  <StatusBadge status={day.status} />
                </div>
                {day.events.length ? (
                  <div className="space-y-3">
                    {day.events.map((event) => (
                      <EventRow key={`${event.source}-${event.id}`} event={event} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Nenhum evento altera o saldo nesta data.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function EventRow({ event }: EventRowProps) {
  const isPositive = event.netImpactCents >= 0;
  const accountName =
    typeof event.metadata?.accountName === "string"
      ? event.metadata.accountName
      : undefined;

  return (
    <div className="rounded-2xl bg-slate-900/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-slate-100">{event.description}</p>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {eventTypeLabels[event.type]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {eventSourceLabels[event.source]}
            {accountName ? ` · ${accountName}` : ""}
          </p>
        </div>
        <p
          className={cn(
            "shrink-0 font-semibold",
            isPositive ? "text-emerald-300" : "text-rose-300"
          )}
        >
          {isPositive ? "+" : "-"}
          {formatCurrency(Math.abs(event.netImpactCents))}
        </p>
      </div>
    </div>
  );
}

function DetailMetric({ label, value, tone = "slate" }: DetailMetricProps) {
  const tones = {
    slate: "text-slate-100",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    sky: "text-sky-300",
    blue: "text-blue-300",
    rose: "text-rose-300",
  } as const;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={cn("mt-2 font-heading text-xl font-semibold", tones[tone])}>
        {value}
      </p>
    </div>
  );
}
