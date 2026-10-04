
export interface CreditCardMonthStripSection1Props {
  isLoading: boolean;
  visiblePoints: import("@/lib/interfaces/credit-card-view").CreditCardMonthPoint[];
  activePageIndex: number;
  showPreviousPage: () => void;
  cardsViewportRef: import("react").RefObject<HTMLDivElement | null>;
  pageStart: number;
  points: import("@/lib/interfaces/credit-card-view").CreditCardMonthPoint[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  maxPageIndex: number;
  showNextPage: () => void;
}
