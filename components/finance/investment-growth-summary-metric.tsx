import type { InvestmentGrowthSummaryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentGrowthSummaryMetric({
  label,
  value,
  tone,
}: InvestmentGrowthSummaryMetricProps) {
  const tones = {
    cyan: "text-brand",
    amber: "text-warning",
    emerald: "text-warning",
  } as const;

  return (
    <div className={`min-w-0 border-l-2 pl-3 ${tones[tone]}`}>
      <p className="text-[11px] font-medium text-content-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-content-strong">{value}</p>
    </div>
  );
}
