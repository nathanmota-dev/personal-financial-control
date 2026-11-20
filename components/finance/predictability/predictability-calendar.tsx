"use client";

import { useMemo } from "react";

import type { PredictabilityDaySelectProps } from "@/app/interfaces/predictability";
import {
  buildPredictabilityCalendarWeeks,
  predictabilityWeekdayLabels,
} from "@/lib/predictability-calendar";

import { PredictabilityCalendarDay } from "./predictability-calendar-day";

export function PredictabilityCalendar({ days, onSelectDay }: PredictabilityDaySelectProps) {
  const weeks = useMemo(() => buildPredictabilityCalendarWeeks(days), [days]);

  return (
    <div className="min-w-0 border-t border-border">
      <div className="px-3 pt-4 pb-3 sm:px-[22px]">
        <div aria-hidden="true" className="grid grid-cols-7 gap-1 pb-2 text-center text-[0.65rem] font-semibold tracking-wider text-content-muted uppercase sm:gap-2">
          {predictabilityWeekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="space-y-1 sm:space-y-2">
          {weeks.map((week) => (
            <ul key={week.key} className="grid grid-cols-7 gap-1 sm:gap-2">
              {week.cells.map((cell) => (
                <PredictabilityCalendarDay key={cell.key} cell={cell} onSelectDay={onSelectDay} />
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-[22px] py-3 text-xs text-content-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          Livre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
          Parte consumida
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />
          Consumido
        </span>
        <span className="ml-auto text-content-subtle">Selecione um dia para ver o que consumiu o valor</span>
      </div>
    </div>
  );
}
