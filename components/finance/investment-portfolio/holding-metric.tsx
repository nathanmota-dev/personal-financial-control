import type { HoldingMetricProps } from "@/lib/interfaces/investment-portfolio";

export function HoldingMetric({ label, value }: HoldingMetricProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5">
      <p className="text-[0.68rem] uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}
