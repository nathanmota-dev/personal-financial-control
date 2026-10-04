import type {
TransactionRow
} from "@/lib/interfaces/transactions";

export interface UseTransactionDialogStateContext {
  transaction: TransactionRow | undefined;
  accounts: import("@/lib/interfaces/transactions").TransactionAccountOption[];
  categories: import("@/lib/interfaces/transactions").TransactionCategoryOption[];
  month: string;
}
