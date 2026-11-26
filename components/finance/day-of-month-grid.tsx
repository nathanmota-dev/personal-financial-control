"use client";

import { Check } from "lucide-react";

import { daysOfMonth } from "@/lib/day-of-month";
import type { DayOfMonthGridProps } from "@/lib/interfaces/day-of-month";
import { cn } from "@/lib/utils";

export function DayOfMonthGrid({ selectedDay, onSelectDay, className }: DayOfMonthGridProps) {
  return (
    <div role="group" aria-label="Dias do mês" className={cn("grid grid-cols-7 gap-1.5", className)}>
      {daysOfMonth.map((day) => {
        const isSelected = day === selectedDay;

        return (
          <button
            key={day}
            type="button"
            aria-label={`Dia ${day}`}
            aria-pressed={isSelected}
            onClick={() => onSelectDay(day)}
            className={cn(
              "relative flex h-10 items-center justify-center rounded-xl border text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
              isSelected
                ? "border-brand/40 bg-brand/15 text-brand"
                : "border-transparent text-content hover:border-border hover:bg-card hover:text-content-strong"
            )}
          >
            {day}
            {isSelected ? <Check aria-hidden="true" className="absolute right-1 top-1 size-2.5" /> : null}
          </button>
        );
      })}
    </div>
  );
}
