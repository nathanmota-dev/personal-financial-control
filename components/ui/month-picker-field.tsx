"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";

import type { MonthPickerFieldProps } from "@/lib/interfaces/date-pickers";
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

function parseMonthValue(month?: string) {
  if (!month) {
    return undefined;
  }

  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) {
    return undefined;
  }

  return new Date(year, monthNumber - 1, 1);
}

function buildMonthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthPickerField({
  id,
  name,
  value,
  month,
  placeholder = "Selecione o mês",
  clearable = false,
  required = false,
  onMonthChange,
  className,
  align = "start",
}: MonthPickerFieldProps) {
  const initialValue = value ?? month;
  const isControlled = onMonthChange !== undefined;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(initialValue);
  const selectedValue = isControlled ? value ?? month : internalValue;

  function handleMonthSelect(date: Date) {
    const nextValue = buildMonthValue(date);
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onMonthChange?.(nextValue);
    setOpen(false);
  }

  function handleClear() {
    if (!isControlled) {
      setInternalValue(undefined);
    }
    onMonthChange?.(undefined);
  }

  const label = selectedValue ? formatMonthLabel(selectedValue) : undefined;

  return (
    <div className="flex min-w-0 gap-2">
      {name ? (
        <input type="hidden" name={name} value={selectedValue ?? ""} required={required} readOnly />
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-haspopup="dialog"
            aria-label={label ?? placeholder}
            className={cn(
              "h-10 min-w-0 flex-1 justify-between rounded-[10px] border-input bg-card px-4 text-left text-sm text-content-strong shadow-none hover:bg-surface-raised/90 focus-visible:border-brand/70 focus-visible:ring-brand/20",
              className
            )}
          >
            <span className={cn("truncate", !label && "text-content")}>
              {label ?? placeholder}
            </span>
            <CalendarDays className="size-4 shrink-0 text-content" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className="w-auto overflow-hidden rounded-xl border border-border bg-popover p-0 text-content-strong shadow-none"
        >
          <MonthPicker
            selectedMonth={parseMonthValue(selectedValue)}
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
      {clearable && selectedValue ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Remover mês"
          className="border-input bg-card text-content hover:bg-surface-raised hover:text-content-strong"
          onClick={handleClear}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
