"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";

import type { YearPickerFieldProps } from "@/lib/interfaces/date-pickers";
import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { YearGrid } from "./year-grid";

function parseYearValue(value?: string) {
  const year = Number(value);
  return Number.isInteger(year) && year > 0 ? year : undefined;
}

export function YearPickerField({
  id,
  value,
  placeholder = "Selecione o ano",
  minYear,
  maxYear,
  onYearChange,
  className,
  align = "start",
}: YearPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedYear = parseYearValue(value);

  function handleYearSelect(year: number) {
    onYearChange(String(year).padStart(4, "0"));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-haspopup="dialog"
          aria-label={selectedYear ? `Selecionar ano: ${selectedYear}` : placeholder}
          className={cn(
            "h-10 min-w-0 justify-between rounded-[10px] border-input bg-card px-4 text-left text-sm text-content-strong shadow-none hover:bg-surface-raised/90 focus-visible:border-brand/70 focus-visible:ring-brand/20",
            className
          )}
        >
          <span className={cn("truncate tabular-nums", !selectedYear && "text-content")}>
            {selectedYear ?? placeholder}
          </span>
          <CalendarDays className="size-4 shrink-0 text-content" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-auto overflow-hidden rounded-xl border border-border bg-popover p-0 text-content-strong shadow-none ring-0"
      >
        <YearGrid
          selectedYear={selectedYear}
          minYear={minYear ?? new Date().getFullYear()}
          maxYear={maxYear}
          onYearSelect={handleYearSelect}
          className="text-content-strong"
        />
      </PopoverContent>
    </Popover>
  );
}
