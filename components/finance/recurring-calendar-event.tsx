import { ArrowDownLeft, ArrowUpRight, Check, TrendingUp } from "lucide-react";

import type { RecurringCalendarEventItemProps } from "@/lib/interfaces/recurring";
import { formatCurrency, transactionTypeLabels } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const eventTone = {
  income: "border-warning/35 bg-warning/10",
  expense: "border-danger/35 bg-danger/10",
  investment_contribution: "border-brand/35 bg-brand/10",
} as const;

const eventIconTone = {
  income: "bg-warning/20 text-warning",
  expense: "bg-danger/20 text-danger",
  investment_contribution: "bg-brand/20 text-brand",
} as const;

const eventIcon = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  investment_contribution: TrendingUp,
} as const;

export function RecurringCalendarEventItem({
  event,
}: RecurringCalendarEventItemProps) {
  const EventIcon = eventIcon[event.type];

  return (
    <li className="py-1 first:pt-0 last:pb-0">
      <div
        className={cn(
          "min-w-0 rounded-xl border p-1.5 text-xs shadow-[0_8px_20px_rgb(var(--surface-rgb) / .14)]",
          eventTone[event.type]
        )}
        title={`${event.description} • ${event.categoryName} • ${event.accountName} • ${transactionTypeLabels[event.type]}`}
      >
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md border border-current/15",
              eventIconTone[event.type]
            )}
          >
            <EventIcon className="size-3" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.72rem] font-semibold leading-4 text-content-strong">
              {event.description}
            </p>
            <p className="mt-0.5 truncate text-[0.62rem] leading-3 text-content/90">
              {event.categoryName} · {transactionTypeLabels[event.type]}
            </p>
          </div>
          {event.isGenerated ? (
            <span
              className="flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-surface/30 text-content-strong"
              title="Lançamento já gerado"
            >
              <Check className="size-3" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex min-w-0 items-center justify-between gap-2 border-t border-current/15 pt-1">
          <span className="min-w-0 truncate text-[0.62rem] font-medium text-content/80">
            {event.accountName}
          </span>
          <span className="shrink-0 font-mono text-[0.68rem] font-semibold tabular-nums text-content-strong">
            {formatCurrency(event.amountCents)}
          </span>
        </div>
      </div>
    </li>
  );
}
