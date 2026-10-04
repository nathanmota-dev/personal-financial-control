
export interface RecurringDialogHandleTypeChangeContext {
  setSelectedType: import("react").Dispatch<import("react").SetStateAction<"income" | "expense" | "investment_contribution">>;
  setSelectedAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  accounts: import("@/lib/interfaces/recurring").RecurringAccountOption[];
  selectedAccountId: string;
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  categories: import("@/lib/interfaces/recurring").RecurringCategoryOption[];
  selectedCategoryId: string;
}
