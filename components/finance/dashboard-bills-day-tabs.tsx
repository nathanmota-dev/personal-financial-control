"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DASHBOARD_BILLS_VISIBLE_DAYS, formatBillDay } from "@/lib/dashboard-bills";
import type { DashboardBillsDayTabsProps } from "@/lib/interfaces/dashboard-bills";
import { cn } from "@/lib/utils";

const MAX_DOTS = 5;

export function DashboardBillsDayTabs({ days, selected, onSelect }: DashboardBillsDayTabsProps) {
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, days.length - DASHBOARD_BILLS_VISIBLE_DAYS);
  const start = Math.min(offset, maxOffset);
  const visible = days.slice(start, start + DASHBOARD_BILLS_VISIBLE_DAYS);
  const paged = days.length > DASHBOARD_BILLS_VISIBLE_DAYS;
  return (
    <div className="mt-5 flex items-center gap-2">
      {paged && start > 0 && (
        <Button type="button" variant="outline" size="icon-sm" className="shrink-0 rounded-full" aria-label="Dias anteriores" onClick={() => setOffset(start - 1)}>
          <ChevronLeft />
        </Button>
      )}
      <div role="tablist" aria-label="Dias de vencimento" className="grid min-w-0 flex-1 grid-cols-5 gap-2">
        {visible.map((day) => {
          const active = day.dueDate === selected;
          return (
            <button
              key={day.dueDate}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid="bills-day-tab"
              onClick={() => onSelect(day.dueDate)}
              className={cn(
                "flex h-[58px] flex-col items-center justify-center gap-1.5 rounded-[14px] border text-sm font-semibold transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-content-strong hover:bg-muted",
              )}
            >
              {formatBillDay(day.day)}
              <span aria-hidden className="flex h-1 gap-0.5">
                {day.bills.slice(0, MAX_DOTS).map((bill) => (
                  <span key={bill.id} className={cn("size-1 rounded-full", active ? "bg-primary-foreground/80" : "bg-content/50")} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {paged && start < maxOffset && (
        <Button type="button" variant="outline" size="icon-sm" className="shrink-0 rounded-full" aria-label="Próximos dias" onClick={() => setOffset(start + 1)}>
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}
