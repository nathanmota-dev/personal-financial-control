"use client";

import { useState } from "react";
import { CalendarDays, Table2 } from "lucide-react";

import type { DailyProjectionExplorerProps } from "@/app/interfaces/projected-balance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DayDetailSheet } from "./day-detail-sheet";
import { DailyProjectionTable } from "./daily-projection-table";
import { ProjectedBalanceCalendar } from "./projected-balance-calendar";

export function DailyProjectionExplorer({
  daily,
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
      className="gap-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-xl font-semibold text-content-strong">
            Leitura diária
          </p>
          <p className="mt-1 text-sm text-content-strong0">
            Navegue pelo mês ou alterne para a conferência em formato de tabela.
          </p>
        </div>
        <TabsList
          variant="line"
          className="h-10 w-full rounded-xl border border-border bg-surface/50 p-1 sm:w-auto"
        >
          <TabsTrigger
            value="calendar"
            className="gap-2 rounded-lg px-3 text-content data-active:text-brand"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Calendário
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className="gap-2 rounded-lg px-3 text-content data-active:text-brand"
          >
            <Table2 className="size-4" aria-hidden="true" />
            Tabela
          </TabsTrigger>
        </TabsList>
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
