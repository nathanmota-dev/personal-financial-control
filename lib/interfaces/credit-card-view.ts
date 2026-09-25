import type {
  CreditCardCategoryOption,
  CreditCardOverview,
} from "@/lib/interfaces/credit-card";

export type ReadyCreditCardOverview = Extract<CreditCardOverview, { state: "ready" }>;

export type CreditCardViewProps = {
  overview: CreditCardOverview;
  categories: CreditCardCategoryOption[];
};

export type CreditCardMonthLoadingProps = {
  month: string;
};

export type CreditCardMonthPoint = {
  month: string;
  totalCents: number;
  entryCount: number;
  billStatus: "open" | "paid" | null;
};

export type CreditCardMonthStripProps = {
  points: CreditCardMonthPoint[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  isLoading: boolean;
};

export type CreditCardTimelineChartProps = {
  points: CreditCardMonthPoint[];
};

export type CreditCardHeroProps = {
  overview: ReadyCreditCardOverview;
  nextInvoice?: CreditCardMonthPoint;
};

export type CreditCardHeroDetailProps = {
  label: string;
  value: string;
  detail: string;
};

export type CreditCardNextInvoiceCardProps = {
  accountId: string;
  creditDueDay: number;
  nextInvoice?: CreditCardMonthPoint;
};

export type CreditCardTransactionsPanelProps = {
  accountId: string;
  categories: CreditCardCategoryOption[];
  month: string;
  entries: ReadyCreditCardOverview["invoice"]["entries"];
  categoryTotals: ReadyCreditCardOverview["invoice"]["categoryTotals"];
};

export type CreditCardCommitmentsProps = {
  overview: ReadyCreditCardOverview;
  monthPoints: CreditCardMonthPoint[];
};

export type CreditCardPageActionsProps = {
  month: string;
  accountId?: string;
  categories?: CreditCardCategoryOption[];
  canCreatePurchase?: boolean;
};

export type CreditCardSetupCardProps = {
  title: string;
  description: string;
  action: React.ReactNode;
};
