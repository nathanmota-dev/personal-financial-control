import type { GoalMetricProps } from "../goals-types";

export function GoalMetric({ label, value }: GoalMetricProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised/45 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-content-strong0">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold text-content-strong">
        {value}
      </p>
    </div>
  );
}
