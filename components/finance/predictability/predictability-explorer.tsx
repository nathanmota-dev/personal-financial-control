"use client";

import { useState } from "react";

import type { PredictabilityExplorerProps } from "@/app/interfaces/predictability";
import { DayViewTabs } from "@/components/finance/day-view-tabs";
import type { PredictabilityDay } from "@/lib/interfaces/predictability";

import { PredictabilityCalendar } from "./predictability-calendar";
import { PredictabilityDaySheet } from "./predictability-day-sheet";
import { PredictabilityTable } from "./predictability-table";

export function PredictabilityExplorer({ days, overflowCents }: PredictabilityExplorerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = days.find((day) => day.date === selectedDate) ?? null;
  const selectDay = (day: PredictabilityDay) => setSelectedDate(day.date);

  return (
    <DayViewTabs
      title="Dias do ciclo"
      description="Cada gasto consome o valor do dia em que foi lançado e dos dias seguintes"
      calendar={<PredictabilityCalendar days={days} onSelectDay={selectDay} />}
      table={<PredictabilityTable days={days} overflowCents={overflowCents} onSelectDay={selectDay} />}
    >
      <PredictabilityDaySheet
        day={selectedDay}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDate(null);
          }
        }}
      />
    </DayViewTabs>
  );
}
