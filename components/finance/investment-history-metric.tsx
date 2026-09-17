import type { InvestmentHistoryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentHistoryMetric({
  label,
  value,
  detail,
  tone,
}: InvestmentHistoryMetricProps) {
  const styles = {
    cyan: "border-brand/15 bg-brand/8 text-brand",
    sky: "border-brand/15 bg-brand/8 text-brand",
    amber: "border-warning/15 bg-warning/8 text-warning",
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${styles[tone]}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold tracking-tight">{value}</p>
      {detail ? <p className="mt-1 text-xs opacity-65">{detail}</p> : null}
    </div>
  );
}
