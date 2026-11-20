"use client";

import { CalendarDays, Table2 } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DayViewMode, DayViewTabsProps } from "@/lib/interfaces/day-detail";

/** Card that switches a day-by-day reading between a calendar and a table. */
export function DayViewTabs({ title, description, actions, calendar, table, children }: DayViewTabsProps) {
  const [view, setView] = useState<DayViewMode>("calendar");

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
          <h2 className="text-lg font-semibold leading-[25px]">{title}</h2>
          <p className="mt-1 text-xs text-content-muted">{description}</p>
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
        {calendar}
      </TabsContent>

      <TabsContent value="table" className="mt-0">
        {table}
      </TabsContent>

      {children}
    </Tabs>
  );
}
