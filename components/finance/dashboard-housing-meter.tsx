import { DASHBOARD_HOUSING_METER_MAX_PERCENT, DASHBOARD_HOUSING_REFERENCE_PERCENT, housingMeterPosition } from "@/lib/dashboard-housing";
import type { DashboardHousingMeterProps } from "@/lib/interfaces/dashboard-housing";
import { cn } from "@/lib/utils";

export function DashboardHousingMeter({ sharePercent }: DashboardHousingMeterProps) {
  const over = sharePercent !== null && sharePercent > DASHBOARD_HOUSING_REFERENCE_PERCENT;
  const referenceLeft = `${housingMeterPosition(DASHBOARD_HOUSING_REFERENCE_PERCENT)}%`;
  return (
    <div className="mt-6" data-testid="housing-meter">
      <div className="relative h-4">
        <span className="absolute -translate-x-1/2 text-[10px] font-medium text-content" style={{ left: referenceLeft }}>{`${DASHBOARD_HOUSING_REFERENCE_PERCENT}%`}</span>
      </div>
      <div className="relative mt-1 h-3.5 overflow-hidden rounded-full bg-surface">
        <div className={cn("h-full rounded-full", over ? "bg-destructive" : "bg-success")} style={{ width: `${housingMeterPosition(sharePercent ?? 0)}%` }} />
        <span className="absolute inset-y-0 w-0.5 bg-content-strong" style={{ left: referenceLeft }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-content">
        <span>0%</span>
        <span>{`${DASHBOARD_HOUSING_METER_MAX_PERCENT}% do salário`}</span>
      </div>
    </div>
  );
}
