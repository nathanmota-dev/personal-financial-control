"use client";

import type {
  DayDetailSheetProps,
  DetailMetricProps,
  EventRowProps,
} from "@/app/interfaces/projected-balance";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { StatusBadge } from "@/components/finance/projected-balance-components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatDateLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { eventSourceLabels, eventTypeLabels } from "./labels";

export function DayDetailSheet({
  day,
  onOpenChange,
  onRemoveSimulation,
}: DayDetailSheetProps) {
  return (
    <Sheet open={Boolean(day)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-border bg-surface text-content-strong sm:max-w-xl">
        {day ? (
          <>
            <SheetHeader className="border-b border-border px-6 py-5 text-left">
              <SheetTitle className="text-xl text-content-strong">
                {formatDateLabel(day.date)}
              </SheetTitle>
              <SheetDescription className="text-content">
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

              <div className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-heading text-base font-semibold text-content-strong">
                    Eventos do dia
                  </h3>
                  <StatusBadge status={day.status} />
                </div>
                {day.events.length ? (
                  <div className="space-y-3">
                    {day.events.map((event) => (
                      <EventRow
                        key={`${event.source}-${event.id}`}
                        event={event}
                        onRemoveSimulation={onRemoveSimulation}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-content">
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

function EventRow({ event, onRemoveSimulation }: EventRowProps) {
  const isPositive = event.netImpactCents >= 0;
  const accountName =
    typeof event.metadata?.accountName === "string"
      ? event.metadata.accountName
      : undefined;
  const simulationId =
    event.source === "simulation" && typeof event.metadata?.simulationId === "string"
      ? event.metadata.simulationId
      : undefined;

  return (
    <div className={cn(financeItemClassName, "p-3")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-content-strong">{event.description}</p>
            <Badge
              variant="outline"
              className={cn(
                "border-input text-content",
                event.source === "simulation" &&
                  "border-warning/30 text-warning"
              )}
            >
              {eventTypeLabels[event.type]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-content-strong0">
            {eventSourceLabels[event.source]}
            {accountName ? ` · ${accountName}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {simulationId && onRemoveSimulation ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-content-strong0 hover:bg-danger/10 hover:text-danger"
              aria-label={`Remover simulação ${event.description}`}
              onClick={() => onRemoveSimulation(simulationId)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
          <p
            className={cn(
              "font-semibold",
              isPositive ? "text-warning" : "text-danger"
            )}
          >
            {isPositive ? "+" : "-"}
            {formatCurrency(Math.abs(event.netImpactCents))}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailMetric({ label, value, tone = "slate" }: DetailMetricProps) {
  const tones = {
    slate: "text-content-strong",
    cyan: "text-brand",
    emerald: "text-warning",
    sky: "text-brand",
    blue: "text-brand",
    rose: "text-danger",
  } as const;

  return (
    <div className="rounded-2xl border border-border bg-surface-raised/50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-content-strong0">{label}</p>
      <p className={cn("mt-2 font-heading text-xl font-semibold", tones[tone])}>
        {value}
      </p>
    </div>
  );
}
