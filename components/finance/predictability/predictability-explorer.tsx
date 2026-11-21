"use client";

import { useMemo, useState } from "react";

import type { PredictabilityExplorerProps } from "@/app/interfaces/predictability";
import { DayViewTabs } from "@/components/finance/day-view-tabs";
import type { PredictabilityDay, PredictabilitySimulatedPurchase } from "@/lib/interfaces/predictability";
import { simulatePurchase } from "@/lib/predictability-simulation";

import { PredictabilityCalendar } from "./predictability-calendar";
import { PredictabilityDaySheet } from "./predictability-day-sheet";
import { PredictabilitySimulationBanner } from "./predictability-simulation-banner";
import { PredictabilitySimulationDialog } from "./predictability-simulation-dialog";
import { PredictabilityTable } from "./predictability-table";

export function PredictabilityExplorer({ predictability }: PredictabilityExplorerProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PredictabilitySimulatedPurchase | null>(null);
  const simulation = useMemo(() => (purchase ? simulatePurchase(predictability, purchase) : null), [predictability, purchase]);
  const current = simulation?.result ?? predictability;
  const simulatedCentsByDate = simulation?.impact.consumedByDate;
  const selectedDay = current.days.find((day) => day.date === selectedDate) ?? null;
  const selectDay = (day: PredictabilityDay) => setSelectedDate(day.date);

  return (
    <DayViewTabs
      title="Dias do ciclo"
      description="Cada gasto consome o valor do dia em que foi lançado e dos dias seguintes"
      actions={<PredictabilitySimulationDialog predictability={predictability} purchase={purchase} onSimulate={setPurchase} />}
      notice={simulation ? <PredictabilitySimulationBanner impact={simulation.impact} onClear={() => setPurchase(null)} /> : null}
      calendar={<PredictabilityCalendar days={current.days} simulatedCentsByDate={simulatedCentsByDate} onSelectDay={selectDay} />}
      table={
        <PredictabilityTable
          days={current.days}
          overflowCents={current.summary.overflowCents}
          simulatedCentsByDate={simulatedCentsByDate}
          onSelectDay={selectDay}
        />
      }
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
