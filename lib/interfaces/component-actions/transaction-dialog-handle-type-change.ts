
export interface TransactionDialogHandleTypeChangeContext {
  setSelectedType: import("react").Dispatch<import("react").SetStateAction<"income" | "expense" | "investment_contribution" | "investment_withdrawal">>;
  setFundingSource: import("react").Dispatch<import("react").SetStateAction<"account" | "investments">>;
  fundingSource: "account" | "investments";
  setSelectedAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  accounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
  selectedAccountId: string;
  selectedCategoryId: string;
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  categories: import("@/lib/interfaces/transactions").TransactionCategoryOption[];
}
