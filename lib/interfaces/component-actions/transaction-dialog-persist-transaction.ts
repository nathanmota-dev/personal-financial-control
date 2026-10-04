import type {
TransactionRow
} from "@/lib/interfaces/transactions";

export interface TransactionDialogPersistTransactionContext {
  afterCategorization: import("@/lib/interfaces/transactions").TransactionDialogProps["afterCategorization"];
  transaction: TransactionRow | undefined;
  showError: (message: string) => void;
  clearReductionState: () => void;
  setOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
  router: import("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterInstance;
}
