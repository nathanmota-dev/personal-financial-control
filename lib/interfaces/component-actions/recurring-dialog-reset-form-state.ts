import type {
RecurringTemplateRow
} from "@/lib/interfaces/recurring";

export interface RecurringDialogResetFormStateContext {
  template: RecurringTemplateRow | undefined;
  setSelectedType: import("react").Dispatch<import("react").SetStateAction<"income" | "expense" | "investment_contribution">>;
  setSelectedAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  accounts: import("@/lib/interfaces/recurring").RecurringAccountOption[];
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  categories: import("@/lib/interfaces/recurring").RecurringCategoryOption[];
  setStartMonth: import("react").Dispatch<import("react").SetStateAction<string>>;
  month: string;
  setEndMonth: import("react").Dispatch<import("react").SetStateAction<string | undefined>>;
  setFormError: import("react").Dispatch<import("react").SetStateAction<string | null>>;
}
