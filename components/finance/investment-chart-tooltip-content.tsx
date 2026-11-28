"use client";

import { ChartTooltipContent } from "@/components/ui/chart";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { InvestmentChartTooltipContentProps } from "@/lib/interfaces/investment-history";

/** Month label on top and each series with the value its chart formats. */
export function InvestmentChartTooltipContent({ renderValue, ...props }: InvestmentChartTooltipContentProps) {
  return (
    <ChartTooltipContent
      {...props}
      labelFormatter={(value) => formatMonthLabel(String(value))}
      formatter={(value, name, item) => (
        <>
          <span className="text-content">{String(name)}</span>
          <strong>{renderValue(Number(value), (item.payload ?? {}) as Record<string, unknown>)}</strong>
        </>
      )}
    />
  );
}
