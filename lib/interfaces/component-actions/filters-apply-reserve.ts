
export interface ProjectionFiltersApplyReserveContext {
  updateFilters: (next: Partial<import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState>) => void;
  reserveInput: string;
  setReserveInput: import("react").Dispatch<import("react").SetStateAction<string>>;
  filters: import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState;
}
