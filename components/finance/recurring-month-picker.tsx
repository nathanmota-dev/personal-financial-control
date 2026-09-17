"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RecurringMonthPickerProps } from "@/lib/interfaces/recurring";
import { formatMonthLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

function parseMonthValue(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

function buildMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function RecurringMonthPicker({
  id,
  name,
  month,
  placeholder,
  clearable = false,
  onMonthChange,
  className,
}: RecurringMonthPickerProps) {
  const [open, setOpen] = useState(false);

  function handleMonthSelect(date: Date) {
    onMonthChange(buildMonthValue(date));
    setOpen(false);
  }

  return (
    <div className="flex min-w-0 gap-2">
      <input type="hidden" name={name} value={month ?? ""} readOnly />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-10 min-w-0 flex-1 justify-between rounded-xl border-input bg-surface/80 pl-4 text-left text-sm text-content-strong shadow-[inset_0_1px_0_rgb(var(--content-rgb) / .08)] hover:bg-surface-raised/90 focus-visible:border-brand/70 focus-visible:ring-brand/20",
              className
            )}
            aria-label={month ? formatMonthLabel(month) : placeholder}
          >
            <span className={cn("truncate", !month && "text-content-strong0")}>
              {month ? formatMonthLabel(month) : placeholder}
            </span>
            <CalendarDays className="size-4 shrink-0 text-content" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto overflow-hidden rounded-[1.5rem] border border-border bg-surface/95 p-0 text-content-strong shadow-[0_24px_80px_rgb(var(--surface-rgb) / .45)]"
        >
          <MonthPicker
            selectedMonth={month ? parseMonthValue(month) : undefined}
            onMonthSelect={handleMonthSelect}
            callbacks={{
              monthLabel: (selectedMonth) => MONTH_LABELS[selectedMonth.number],
            }}
            variant={{
              calendar: {
                main: "ghost",
                selected: "secondary",
              },
              chevrons: "ghost",
            }}
            className="text-content-strong"
          />
        </PopoverContent>
      </Popover>
      {clearable && month ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Remover mês de encerramento"
          className="border-input bg-surface/80 text-content hover:bg-surface-raised hover:text-content-strong"
          onClick={() => onMonthChange(undefined)}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
