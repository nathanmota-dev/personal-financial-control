"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";

import type { DatePickerFieldProps } from "@/lib/interfaces/date-pickers";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseDateValue(value?: string) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function buildDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateLabel(value?: string) {
  const date = parseDateValue(value);
  return date ? format(date, "PPP", { locale: ptBR }) : undefined;
}

export function DatePickerField({
  id,
  name,
  value,
  placeholder = "Selecione a data",
  clearable = false,
  required = false,
  onDateChange,
  className,
  align = "start",
}: DatePickerFieldProps) {
  const isControlled = onDateChange !== undefined;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const selectedValue = isControlled ? value : internalValue;

  function handleDateSelect(date: Date | undefined) {
    const nextValue = date ? buildDateValue(date) : undefined;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onDateChange?.(nextValue);
    setOpen(false);
  }

  function handleClear() {
    if (!isControlled) {
      setInternalValue(undefined);
    }
    onDateChange?.(undefined);
  }

  const label = dateLabel(selectedValue);

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
              "h-11 min-w-0 flex-1 justify-between rounded-xl border-input bg-surface/80 px-4 text-left text-sm text-content-strong shadow-[inset_0_1px_0_rgb(var(--content-rgb) / .08)] hover:bg-surface-raised/90 focus-visible:border-brand/70 focus-visible:ring-brand/20",
              className
            )}
          >
            <span className={cn("truncate", !label && "text-content-strong0")}>
              {label ?? placeholder}
            </span>
            <CalendarDays className="size-4 shrink-0 text-content" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className="w-auto overflow-hidden rounded-[1.5rem] border border-border bg-surface/95 p-0 text-content-strong shadow-[0_24px_80px_rgb(var(--surface-rgb) / .45)]"
        >
          <Calendar
            mode="single"
            selected={parseDateValue(selectedValue)}
            onSelect={handleDateSelect}
            locale={ptBR}
            initialFocus
            className="text-content-strong"
          />
        </PopoverContent>
      </Popover>
      {clearable && selectedValue ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Remover data"
          className="border-input bg-surface/80 text-content hover:bg-surface-raised hover:text-content-strong"
          onClick={handleClear}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
