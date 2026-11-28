import { ChartLine } from "lucide-react";

import type { InvestmentHistoryEmptyProps } from "@/lib/interfaces/investment-history";

export function InvestmentHistoryEmpty({ title, description }: InvestmentHistoryEmptyProps) {
  return (
    <div className="mt-5 flex min-h-[240px] flex-1 flex-col items-center justify-center rounded-xl bg-[var(--chart-surface)] px-6 text-center">
      <ChartLine aria-hidden className="size-6 text-primary" />
      <p className="mt-3 text-sm font-semibold text-content-strong">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-content">{description}</p>
    </div>
  );
}
