
export interface DailyProjectionTableDiv1Props {
  daily: import("@/lib/interfaces/projected-balance").DailyProjection[];
  onSelectDay: (day: import("@/lib/interfaces/projected-balance").DailyProjection) => void;
}
