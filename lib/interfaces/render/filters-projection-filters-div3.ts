
export interface ProjectionFiltersDiv3Props {
  filters: import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState;
  updateFilters: (next: Partial<import("@/app/interfaces/projected-balance").ProjectedBalanceFilterState>) => void;
  isStartDatePickerOpen: boolean;
  setIsStartDatePickerOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  accounts: import("@/app/interfaces/projected-balance").ProjectedBalanceAccountOption[];
  reserveInput: string;
  setReserveInput: import("react").Dispatch<import("react").SetStateAction<string>>;
  applyReserve: () => void;
  isPending: boolean;
}
