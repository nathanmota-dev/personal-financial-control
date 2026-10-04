
export interface TransactionDialogDiv3Props {
  formId: string;
  selectedCategoryId: string;
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  categoryRequired: boolean;
  filteredCategories: import("@/lib/interfaces/transactions").TransactionCategoryOption[];
}
