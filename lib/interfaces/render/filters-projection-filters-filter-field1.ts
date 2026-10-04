
export interface ProjectionFiltersFilterField1Props {
  isStartDatePickerOpen: boolean;
  setIsStartDatePickerOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  filters: import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState;
  updateFilters: (next: Partial<import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState>) => void;
}
