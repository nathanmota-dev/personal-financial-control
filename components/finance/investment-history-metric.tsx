import type { InvestmentHistoryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentHistoryMetric({
  label,
  value,
  detail,
  tone,
}: InvestmentHistoryMetricProps) {
  const styles = {
    cyan: "bg-chart-1",
    sky: "bg-chart-5",
    amber: "bg-chart-2",
  } as const;

  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-content"><span aria-hidden className={`size-2 shrink-0 rounded-full ${styles[tone]}`} />{label}</dt>
      <dd className="mt-1 break-words text-[15px] font-semibold text-content-strong">{value}</dd>
      {detail ? <p className="mt-0.5 text-[11px] text-content-subtle">{detail}</p> : null}
    </div>
  );
}
