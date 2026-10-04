"use client";

import { getDefaultSimulationDate,getSimulationMonthCount,parseDate } from "@/lib/utils/components/investments-view";
import { addMonths,addYears,startOfMonth } from "date-fns";
import { useState } from "react";
import { InvestmentsViewDiv2 } from "./investments-view-investments-view-div2";

import type { InvestmentsViewProps } from "@/lib/interfaces/investments";
import { projectCompoundBalance } from "@/lib/investment-projection";

export function InvestmentsView({
  projection,
  contributionHistory,
}: InvestmentsViewProps) {
  const today = new Date();
  const currentMonth = startOfMonth(today);
  const referenceDate = projection ? parseDate(projection.asOfDate) : today;
  const referenceMonth = startOfMonth(referenceDate);
  const earliestFutureMonth = addMonths(currentMonth, 1);
  const firstMonthAfterReference = addMonths(referenceMonth, 1);
  const minSimulationMonth =
    firstMonthAfterReference > earliestFutureMonth
      ? firstMonthAfterReference
      : earliestFutureMonth;
  const maxSimulationMonth = addYears(minSimulationMonth, 50);
  const defaultSimulationDate = getDefaultSimulationDate(today, minSimulationMonth);
  const defaultSimulatedMonths = getSimulationMonthCount(
    defaultSimulationDate,
    referenceMonth
  );
  const [isSimulationPickerOpen, setIsSimulationPickerOpen] = useState(false);
  const [selectedSimulationDate, setSelectedSimulationDate] = useState<Date | undefined>(
    projection ? defaultSimulationDate : undefined
  );
  const [simulatedMonths, setSimulatedMonths] = useState<number | null>(
    projection ? defaultSimulatedMonths : null
  );

  const cards = [1, 6, 12, 24].map((months) => ({
    months,
    value: projection?.projection[months] ?? null,
  }));
  const simulatedValue =
    projection && simulatedMonths
      ? projectCompoundBalance({
          currentBalanceCents: projection.currentBalanceCents,
          expectedMonthlyRateBps: projection.expectedMonthlyRateBps,
          referenceDate: projection.asOfDate,
          movements: projection.plannedMovements,
          months: simulatedMonths,
        })
      : null;

  function applySimulation(date?: Date) {
    const normalizedDate = date ? startOfMonth(date) : undefined;
    setSelectedSimulationDate(normalizedDate);

    if (!normalizedDate) {
      setSimulatedMonths(null);
      return;
    }

    const normalized = getSimulationMonthCount(normalizedDate, referenceMonth);

    if (normalized > 1) {
      setSimulatedMonths(normalized);
      setIsSimulationPickerOpen(false);
      return;
    }

    setSimulatedMonths(null);
  }

  return (
    <InvestmentsViewDiv2 projection={projection} contributionHistory={contributionHistory} cards={cards} isSimulationPickerOpen={isSimulationPickerOpen} setIsSimulationPickerOpen={setIsSimulationPickerOpen} selectedSimulationDate={selectedSimulationDate} applySimulation={applySimulation} minSimulationMonth={minSimulationMonth} maxSimulationMonth={maxSimulationMonth} simulatedMonths={simulatedMonths} simulatedValue={simulatedValue} />
  );
}
