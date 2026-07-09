import type { GoalMetricProps } from "../goals-types";

export function GoalMetric({ label, value }: GoalMetricProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/45 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-lg font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}
