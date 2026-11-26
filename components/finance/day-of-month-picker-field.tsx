"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { DayOfMonthAdjustments } from "@/components/finance/day-of-month-adjustments";
import { DayOfMonthGrid } from "@/components/finance/day-of-month-grid";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listDayOfMonthAdjustments } from "@/lib/day-of-month";
import { getDefaultMonth } from "@/lib/finance-ui";
import type { DayOfMonthPickerFieldProps } from "@/lib/interfaces/day-of-month";
import { cn } from "@/lib/utils";

export function DayOfMonthPickerField({ id, name, defaultDay, startMonth, className }: DayOfMonthPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(defaultDay);
  const currentMonth = getDefaultMonth();
  const previewMonth = startMonth > currentMonth ? startMonth : currentMonth;
  const label = `Dia ${day}`;

  function selectDay(nextDay: number) {
    setDay(nextDay);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={day} readOnly />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-haspopup="dialog"
            className={cn(
              "h-10 w-full min-w-0 justify-between rounded-[10px] border-input bg-card px-4 text-left text-sm text-content-strong shadow-none hover:bg-surface-raised/90 focus-visible:border-brand/70 focus-visible:ring-brand/20",
              className
            )}
          >
            <span className="truncate">{label}</span>
            <CalendarDays className="size-4 shrink-0 text-content" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[19rem] rounded-xl border border-border bg-popover p-3 text-content-strong shadow-none ring-0">
          <DayOfMonthGrid selectedDay={day} onSelectDay={selectDay} />
        </PopoverContent>
      </Popover>
      <DayOfMonthAdjustments day={day} adjustments={listDayOfMonthAdjustments(previewMonth, day)} />
    </div>
  );
}
