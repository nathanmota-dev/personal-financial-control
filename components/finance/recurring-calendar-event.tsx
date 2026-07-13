import { ArrowDownLeft, ArrowUpRight, Check, TrendingUp } from "lucide-react";

import type { RecurringCalendarEventItemProps } from "@/lib/interfaces/recurring";
import { formatCurrency, transactionTypeLabels } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const eventTone = {
  income: "border-emerald-300/35 bg-emerald-400/10",
  expense: "border-rose-300/35 bg-rose-400/10",
  investment_contribution: "border-cyan-300/35 bg-cyan-400/10",
} as const;

const eventIconTone = {
  income: "bg-emerald-300/20 text-emerald-200",
  expense: "bg-rose-300/20 text-rose-200",
  investment_contribution: "bg-cyan-300/20 text-cyan-200",
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
          "min-w-0 rounded-xl border p-1.5 text-xs shadow-[0_8px_20px_rgba(2,6,23,0.14)]",
          eventTone[event.type]
        )}
        title={`${event.description} • ${event.categoryName} • ${event.accountName} • ${transactionTypeLabels[event.type]}`}
      >
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-md",
              eventIconTone[event.type]
            )}
          >
            <EventIcon className="size-3" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.72rem] font-semibold leading-4 text-slate-50">
              {event.description}
            </p>
            <p className="mt-0.5 truncate text-[0.62rem] leading-3 text-slate-300/90">
              {event.categoryName} · {transactionTypeLabels[event.type]}
            </p>
          </div>
          {event.isGenerated ? (
            <span
              className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-950/30 text-slate-100"
              title="Lançamento já gerado"
            >
              <Check className="size-3" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex min-w-0 items-center justify-between gap-2 border-t border-current/15 pt-1">
          <span className="min-w-0 truncate text-[0.62rem] font-medium text-slate-300/80">
            {event.accountName}
          </span>
          <span className="shrink-0 font-mono text-[0.68rem] font-semibold tabular-nums text-slate-50">
            {formatCurrency(event.amountCents)}
          </span>
        </div>
      </div>
    </li>
  );
}
