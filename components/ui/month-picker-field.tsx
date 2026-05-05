"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { formatMonthLabel } from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

import { Button } from "./button";
import { MonthPicker } from "./monthpicker";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

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

export function MonthPickerField({
  month,
  onMonthChange,
  className,
  align = "start",
}: {
  month: string;
  onMonthChange: (month: string) => void;
  className?: string;
  align?: React.ComponentProps<typeof PopoverContent>["align"];
}) {
  const [open, setOpen] = useState(false);

  function handleMonthSelect(date: Date) {
    onMonthChange(buildMonthValue(date));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 justify-between rounded-xl border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900",
            className
          )}
        >
          <span>{formatMonthLabel(month)}</span>
          <CalendarDays className="size-4 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950/95 p-0 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]"
      >
        <MonthPicker
          selectedMonth={parseMonthValue(month)}
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
          className="text-slate-100"
        />
      </PopoverContent>
    </Popover>
  );
}
