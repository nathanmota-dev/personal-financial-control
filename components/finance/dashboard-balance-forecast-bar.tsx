import type { DashboardBalanceForecastBarProps } from "@/lib/interfaces/dashboard-balance-forecast";
import { cn } from "@/lib/utils";

export function DashboardBalanceForecastBar({ segments }: DashboardBalanceForecastBarProps) {
  return (
    <div data-testid="balance-forecast-bar" className="mt-6 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface">
      {segments.map((segment) => (
        <div key={segment.key} className={cn("h-full", segment.colorClassName)} style={{ width: `${segment.width}%` }} />
      ))}
    </div>
  );
}
