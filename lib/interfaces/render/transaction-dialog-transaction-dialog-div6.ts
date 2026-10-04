
export interface TransactionDialogDiv6Props {
  formId: string;
  selectedType: "income" | "expense" | "investment_contribution" | "investment_withdrawal";
  handleTypeChange: (value: string) => void;
  transaction: import("@/lib/interfaces/transactions").TransactionRow | undefined;
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
}
