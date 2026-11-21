"use client";

import type { PredictabilityAllocationRowProps } from "@/app/interfaces/predictability";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { formatDateLabel } from "@/lib/finance-ui";
import { SIMULATED_PURCHASE_ID } from "@/lib/predictability-simulation";
import { cn } from "@/lib/utils";

export function PredictabilityAllocationRow({ allocation, dayDate }: PredictabilityAllocationRowProps) {
  const { formatCurrency } = useFinancialFormatter();
  const isRelease = allocation.cents < 0;
  const isSimulated = allocation.transactionId === SIMULATED_PURCHASE_ID;
  const verb = isSimulated ? "simulado" : "lançado";
  const origin = allocation.transactionDate === dayDate ? `${verb} neste dia` : `${verb} em ${formatDateLabel(allocation.transactionDate)}`;

  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
      <div className="min-w-0">
        <p data-user-content className="truncate font-medium text-content-strong">{allocation.description}</p>
        <p className="mt-0.5 text-xs text-content-muted">{isRelease ? `Estorno ${origin}` : origin}</p>
      </div>
      <span className={cn("shrink-0 font-semibold tabular-nums", isRelease ? "text-success" : "text-danger")}>
        {isRelease ? "+" : "−"}
        {formatCurrency(Math.abs(allocation.cents))}
      </span>
    </li>
  );
}
