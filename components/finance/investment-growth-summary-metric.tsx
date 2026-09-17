import type { InvestmentGrowthSummaryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentGrowthSummaryMetric({
  label,
  value,
  tone,
}: InvestmentGrowthSummaryMetricProps) {
  const tones = {
    cyan: "border-brand/20 bg-brand/10 text-brand",
    amber: "border-warning/20 bg-warning/10 text-warning",
    emerald: "border-warning/20 bg-warning/10 text-warning",
  } as const;

  return (
    <div className={`rounded-2xl border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
