import type { InvestmentGrowthSummaryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentGrowthSummaryMetric({
  label,
  value,
  tone,
}: InvestmentGrowthSummaryMetricProps) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  } as const;

  return (
    <div className={`rounded-2xl border px-3 py-2 ${tones[tone]}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
