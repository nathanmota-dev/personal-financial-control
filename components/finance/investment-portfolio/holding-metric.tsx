import type { HoldingMetricProps } from "@/lib/interfaces/investment-portfolio";

export function HoldingMetric({ label, value }: HoldingMetricProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-2.5">
      <p className="text-[0.68rem] font-medium text-content">{label}</p>
      <p className="mt-1 text-sm font-medium text-content-strong">{value}</p>
    </div>
  );
}
