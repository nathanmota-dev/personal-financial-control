import type { InvestmentGrowthSummaryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentGrowthSummaryMetric({
  label,
  value,
  tone,
}: InvestmentGrowthSummaryMetricProps) {
  const tones = {
    cyan: "bg-chart-1",
    amber: "bg-chart-2",
    emerald: "bg-chart-4",
  } as const;

  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-content"><span aria-hidden className={`size-2 shrink-0 rounded-full ${tones[tone]}`} />{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold tracking-tight text-content-strong">{value}</dd>
    </div>
  );
}
