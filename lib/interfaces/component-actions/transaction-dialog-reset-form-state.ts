import type {
TransactionRow
} from "@/lib/interfaces/transactions";

export interface TransactionDialogResetFormStateContext {
  transaction: TransactionRow | undefined;
  setSelectedType: import("react").Dispatch<import("react").SetStateAction<"income" | "expense" | "investment_contribution" | "investment_withdrawal">>;
  setSelectedAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  accounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
  setSelectedCategoryId: import("react").Dispatch<import("react").SetStateAction<string>>;
  categories: import("@/lib/interfaces/transactions").TransactionCategoryOption[];
  setTransactionDate: import("react").Dispatch<import("react").SetStateAction<string>>;
  month: string;
  setCompetenceMonth: import("react").Dispatch<import("react").SetStateAction<string>>;
  setFundingSource: import("react").Dispatch<import("react").SetStateAction<"account" | "investments">>;
  setFormError: import("react").Dispatch<import("react").SetStateAction<string | null>>;
}
