import type { GoalMetricProps } from "../goals-types";

export function GoalMetric({ label, value }: GoalMetricProps) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-content-muted">{label}</p>
      <p className="mt-0.5 break-words text-[15px] font-semibold text-content-strong tabular-nums">
        {value}
      </p>
    </div>
  );
}
