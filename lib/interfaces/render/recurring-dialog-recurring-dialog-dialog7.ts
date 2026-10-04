import type {
RecurringTemplateRow
} from "@/lib/interfaces/recurring";

export interface RecurringDialogDialog7Props {
  open: boolean;
  handleOpenChange: (nextOpen: boolean) => void;
  trigger: import("react").ReactNode;
  template: RecurringTemplateRow | undefined;
  hasSetup: boolean;
  startTransition: import("react").TransitionStartFunction;
  onSubmit: (formData: FormData) => Promise<void>;
  formId: string;
  selectedType: "income" | "expense" | "investment_contribution";
  handleTypeChange: (value: string) => void;
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
  formError: string | null;
  isPending: boolean;
}
