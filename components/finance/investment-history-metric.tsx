import type { InvestmentHistoryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentHistoryMetric({
  label,
  value,
  detail,
  tone,
}: InvestmentHistoryMetricProps) {
  const styles = {
    cyan: "border-cyan-400/15 bg-cyan-400/8 text-cyan-200",
    sky: "border-sky-400/15 bg-sky-400/8 text-sky-200",
    amber: "border-amber-300/15 bg-amber-300/8 text-amber-200",
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${styles[tone]}`}>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold tracking-tight">{value}</p>
      {detail ? <p className="mt-1 text-xs opacity-65">{detail}</p> : null}
    </div>
  );
}
