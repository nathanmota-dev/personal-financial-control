
export interface TransactionsViewDiv1Props {
  transactions: import("@/lib/interfaces/transactions").TransactionRow[];
  accounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
  categories: import("@/lib/interfaces/transactions").TransactionCategoryOption[];
  filters: import("@/lib/interfaces/transactions").TransactionFilters;
  afterLastCategorization: string | undefined;
}
