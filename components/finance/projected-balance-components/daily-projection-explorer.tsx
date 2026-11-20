"use client";

import { useState } from "react";

import type { DailyProjectionExplorerProps } from "@/app/interfaces/projected-balance";
import { DayViewTabs } from "@/components/finance/day-view-tabs";

import { DailyProjectionTable } from "./daily-projection-table";
import { DayDetailSheet } from "./day-detail-sheet";
import { ProjectedBalanceCalendar } from "./projected-balance-calendar";

export function DailyProjectionExplorer({
  daily,
  actions,
  onRemoveSimulation,
}: DailyProjectionExplorerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = daily.find((day) => day.date === selectedDate) ?? null;

  return (
    <DayViewTabs
      title="Leitura diária"
      description="Navegue pelo mês ou alterne para a conferência em formato de tabela"
      actions={actions}
      calendar={
        <ProjectedBalanceCalendar
          daily={daily}
          onSelectDay={(day) => setSelectedDate(day.date)}
        />
      }
      table={
        <DailyProjectionTable
          daily={daily}
          onSelectDay={(day) => setSelectedDate(day.date)}
        />
      }
    >
      <DayDetailSheet
        day={selectedDay}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDate(null);
          }
        }}
        onRemoveSimulation={onRemoveSimulation}
      />
    </DayViewTabs>
  );
}
