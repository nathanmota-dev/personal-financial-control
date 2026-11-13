"use client";

import { CalendarDays,Table2 } from "lucide-react";
import { useState } from "react";

import type { DailyProjectionExplorerProps } from "@/app/interfaces/projected-balance";
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs";

import { DailyProjectionTable } from "./daily-projection-table";
import { DayDetailSheet } from "./day-detail-sheet";
import { ProjectedBalanceCalendar } from "./projected-balance-calendar";

export function DailyProjectionExplorer({
  daily,
  actions,
  onRemoveSimulation,
}: DailyProjectionExplorerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useState<"calendar" | "table">("calendar");
  const selectedDay = daily.find((day) => day.date === selectedDate) ?? null;

  return (
    <Tabs
      value={view}
      onValueChange={(value) => {
        if (value === "calendar" || value === "table") {
          setView(value);
        }
      }}
      className="gap-4 overflow-hidden rounded-[20px] border border-border bg-card"
    >
      <div className="flex flex-col gap-3 px-[22px] pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold leading-[25px]">Leitura diária</h2>
          <p className="mt-1 text-xs text-content-muted">
            Navegue pelo mês ou alterne para a conferência em formato de tabela
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <TabsList variant="line">
            <TabsTrigger value="calendar">
              <CalendarDays aria-hidden="true" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table2 aria-hidden="true" />
              Tabela
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value="calendar" className="mt-0">
        <ProjectedBalanceCalendar
          daily={daily}
          onSelectDay={(day) => setSelectedDate(day.date)}
        />
      </TabsContent>

      <TabsContent value="table" className="mt-0">
        <DailyProjectionTable
          daily={daily}
          onSelectDay={(day) => setSelectedDate(day.date)}
        />
      </TabsContent>

      <DayDetailSheet
        day={selectedDay}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDate(null);
          }
        }}
        onRemoveSimulation={onRemoveSimulation}
      />
    </Tabs>
  );
}
