
export interface RecurringDialogDiv4Props {
  formId: string;
  selectedCategoryId: string;
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  filteredCategories: import("@/lib/interfaces/recurring").RecurringCategoryOption[];
  selectedType: "income" | "expense" | "investment_contribution";
}
