import type { GoalMetricProps } from "../goals-types";

export function GoalMetric({ label, value }: GoalMetricProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-content">{label}</p>
      <p className="mt-1 break-all text-lg font-semibold text-content-strong tabular-nums">
        {value}
      </p>
    </div>
  );
}
