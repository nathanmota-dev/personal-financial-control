"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { YearGridProps } from "@/lib/interfaces/date-pickers";
import { cn } from "@/lib/utils";

import { buttonVariants } from "./button";

const YEARS_PER_PAGE = 12;

const chevronClassName =
  "absolute inline-flex h-8 w-8 items-center justify-center rounded-full border-transparent bg-transparent p-0 text-content shadow-none hover:bg-surface-raised hover:text-content-strong disabled:pointer-events-none disabled:opacity-40";

function initialPageStart(minYear: number, selectedYear?: number) {
  if (!selectedYear || selectedYear < minYear) {
    return minYear;
  }
  return minYear + Math.floor((selectedYear - minYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

export function YearGrid({ selectedYear, minYear, maxYear, onYearSelect, className }: YearGridProps) {
  const [pageStart, setPageStart] = useState(() => initialPageStart(minYear, selectedYear));
  const years = Array.from({ length: YEARS_PER_PAGE }, (_, index) => pageStart + index);
  const canGoBack = pageStart > minYear;
  const canGoForward = maxYear === undefined || pageStart + YEARS_PER_PAGE <= maxYear;

  return (
    <div className={cn("w-[280px] min-w-[200px] bg-popover p-4", className)}>
      <div className="relative flex items-center justify-center px-1 pt-1">
        <button
          type="button"
          aria-label="Anos anteriores"
          disabled={!canGoBack}
          onClick={() => setPageStart(pageStart - YEARS_PER_PAGE)}
          className={cn(buttonVariants({ variant: "ghost" }), chevronClassName, "left-1")}
        >
          <ChevronLeft className="h-4 w-4 opacity-50" />
        </button>
        <div className="text-sm font-medium text-content-strong">Escolha o ano</div>
        <button
          type="button"
          aria-label="Próximos anos"
          disabled={!canGoForward}
          onClick={() => setPageStart(pageStart + YEARS_PER_PAGE)}
          className={cn(buttonVariants({ variant: "ghost" }), chevronClassName, "right-1")}
        >
          <ChevronRight className="h-4 w-4 opacity-50" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-y-2">
        {years.map((year) => {
          const selected = year === selectedYear;
          return (
            <button
              key={year}
              type="button"
              aria-pressed={selected}
              disabled={year < minYear || (maxYear !== undefined && year > maxYear)}
              onClick={() => onYearSelect(year)}
              className={cn(
                buttonVariants({ variant: selected ? "secondary" : "ghost" }),
                "h-10 w-full rounded-xl p-0 font-normal tabular-nums"
              )}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
