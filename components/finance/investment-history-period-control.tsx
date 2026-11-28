"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { InvestmentHistoryPeriodControlProps } from "@/lib/interfaces/investment-history";
import { INVESTMENT_HISTORY_PERIODS, isInvestmentHistoryPeriod } from "@/lib/utils/components/investment-history";

export function InvestmentHistoryPeriodControl({ value, onChange }: InvestmentHistoryPeriodControlProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label="Período do histórico"
      value={value}
      onValueChange={(next) => { if (isInvestmentHistoryPeriod(next)) onChange(next); }}
      className="rounded-[10px] bg-card"
    >
      {INVESTMENT_HISTORY_PERIODS.map((period) => (
        <ToggleGroupItem key={period.value} value={period.value} className="h-8 min-w-12 px-3 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
          {period.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
