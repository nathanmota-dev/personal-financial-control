import type {
RecurringTemplateRow
} from "@/lib/interfaces/recurring";

export interface RecurringDialogDiv6Props {
  formId: string;
  selectedType: "income" | "expense" | "investment_contribution";
  handleTypeChange: (value: string) => void;
  template: RecurringTemplateRow | undefined;
  selectedAccountId: string;
  setSelectedAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  filteredAccounts: import("@/lib/interfaces/recurring").RecurringAccountOption[];
  selectedCategoryId: string;
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  filteredCategories: import("@/lib/interfaces/recurring").RecurringCategoryOption[];
  startMonth: string;
  setStartMonth: import("react").Dispatch<import("react").SetStateAction<string>>;
  endMonth: string | undefined;
  setEndMonth: import("react").Dispatch<import("react").SetStateAction<string | undefined>>;
}
