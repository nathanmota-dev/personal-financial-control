
export interface ProjectionFiltersFilterField2Props {
  filters: import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState;
  updateFilters: (next: Partial<import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState>) => void;
  accounts: import("@/app/interfaces/projected-balance").ProjectedBalanceAccountOption[];
}
