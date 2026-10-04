
export interface TransactionDialogDiv2Props {
  formId: string;
  isInvestmentExpense: boolean;
  selectedAccountId: string;
  setSelectedAccountId: import("react").Dispatch<import("react").SetStateAction<string>>;
  filteredAccounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
}
