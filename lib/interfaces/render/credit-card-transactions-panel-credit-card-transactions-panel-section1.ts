import type { TransactionView } from "@/lib/interfaces/components/credit-card-transactions-panel";

export interface CreditCardTransactionsPanelSection1Props {
  entries: { id: string; chargeId?: string; source: "installment" | "legacy_transaction"; amountCents: number; totalAmountCents?: number; kind?: "purchase" | "adjustment"; description: string; expenseDate: string; purchaseDate: string; notes?: string | null; installmentNumber?: number; installmentCount?: number; category: { id: string; name: string; group: string; } | null; }[];
  view: TransactionView;
  setView: import("react").Dispatch<import("react").SetStateAction<TransactionView>>;
  query: string;
  setQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
  categoryFilter: string;
  setCategoryFilter: import("react").Dispatch<import("react").SetStateAction<string>>;
  categories: import("@/lib/interfaces/credit-card").CreditCardCategoryOption[];
  filteredEntries: { id: string; chargeId?: string; source: "installment" | "legacy_transaction"; amountCents: number; totalAmountCents?: number; kind?: "purchase" | "adjustment"; description: string; expenseDate: string; purchaseDate: string; notes?: string | null; installmentNumber?: number; installmentCount?: number; category: { id: string; name: string; group: string; } | null; }[];
  accountId: string;
  month: string;
  categoryTotals: { categoryId: string; categoryName: string; amountCents: number; group: string; }[];
}
