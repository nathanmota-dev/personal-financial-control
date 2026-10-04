import type { InvestmentHistoryMetricProps } from "@/lib/interfaces/investments";

export function InvestmentHistoryMetric({
  label,
  value,
  detail,
  tone,
}: InvestmentHistoryMetricProps) {
  const styles = {
    cyan: "text-brand",
    sky: "text-brand",
    amber: "text-warning",
  } as const;

  return (
    <div className={`min-w-0 border-l-2 pl-3 ${styles[tone]}`}>
      <p className="text-[11px] font-medium text-content-muted">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold tracking-tight text-content-strong">{value}</p>
      {detail ? <p className="mt-1 text-[11px] text-content-subtle">{detail}</p> : null}
    </div>
  );
}
