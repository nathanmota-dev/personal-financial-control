
export interface CreditCardViewDiv1Props {
  overview: Extract<import("@/lib/interfaces/credit-card").CreditCardOverview, { state: "ready" }>;
  expenseCategories: import("@/lib/interfaces/credit-card").CreditCardCategoryOption[];
  canCreatePurchase: boolean;
  monthPoints: import("@/lib/interfaces/credit-card-view").CreditCardMonthPoint[];
  selectedMonth: string;
  selectMonth: (month: string) => void;
  isPending: boolean;
}
