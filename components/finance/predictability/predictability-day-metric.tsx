import type { PredictabilityDayMetricProps } from "@/app/interfaces/predictability";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { cn } from "@/lib/utils";

export function PredictabilityDayMetric({ label, value, className }: PredictabilityDayMetricProps) {
  return (
    <div className={cn(financeItemClassName, "p-3")}>
      <p className="text-xs text-content">{label}</p>
      <p className={cn("mt-1 font-semibold tabular-nums", className)}>{value}</p>
    </div>
  );
}
