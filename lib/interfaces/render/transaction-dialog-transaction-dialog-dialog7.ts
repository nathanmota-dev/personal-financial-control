
export interface TransactionDialogDialog7Props {
  open: boolean;
  handleOpenChange: (nextOpen: boolean) => void;
  trigger: import("react").ReactNode;
  transaction: import("@/lib/interfaces/transactions").TransactionRow | undefined;
  accounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
  startTransition: import("react").TransitionStartFunction;
  onSubmit: (formData: FormData) => Promise<void>;
  formId: string;
  selectedType: "income" | "expense" | "investment_contribution" | "investment_withdrawal";
  handleTypeChange: (value: string) => void;
  isManualExpense: boolean;
  fundingSource: "account" | "investments";
  setFundingSource: import("react").Dispatch<import("react").SetStateAction<"account" | "investments">>;
  isInvestmentExpense: boolean;
  selectedAccountId: string;
  setSelectedAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  filteredAccounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
  selectedCategoryId: string;
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  categoryRequired: boolean;
  filteredCategories: import("@/lib/interfaces/transactions").TransactionCategoryOption[];
  transactionDate: string;
  setTransactionDate: import("react").Dispatch<import("react").SetStateAction<string>>;
  competenceMonth: string;
  setCompetenceMonth: import("react").Dispatch<import("react").SetStateAction<string>>;
  formError: string | null;
  isPending: boolean;
}
