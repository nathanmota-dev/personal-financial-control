import type {
CreditCardCategoryOption,
CreditCardOverview,
} from "@/lib/interfaces/credit-card";
import type { DashboardCardsData } from "@/lib/interfaces/dashboard-cards";

export type ReadyCreditCardOverview = Extract<CreditCardOverview, { state: "ready" }>;

export type CreditCardViewProps = {
  overview: CreditCardOverview;
  categories: CreditCardCategoryOption[];
  loadError?: boolean;
  /** Active credit cards for the carousel; empty or omitted when only the overview is known. */
  cards?: DashboardCardsData;
  selectedCardId?: string;
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

export type CreditCardNextInvoiceCardProps = {
  accountId: string;
  creditDueDay: number;
  nextInvoice?: CreditCardMonthPoint;
};

export type CreditCardEntry = ReadyCreditCardOverview["invoice"]["entries"][number];

export type CreditCardTransactionsPanelProps = {
  accountId: string;
  categories: CreditCardCategoryOption[];
  month: string;
  entries: ReadyCreditCardOverview["invoice"]["entries"];
  categoryTotals: ReadyCreditCardOverview["invoice"]["categoryTotals"];
};

export type CreditCardCommitmentsProps = {
  overview: ReadyCreditCardOverview;
};

export type CreditCardsShowcaseProps = {
  cards: DashboardCardsData;
  selectedId: string;
  month: string;
  onSelect: (id: string) => void;
};

export type CreditCardInvoiceSummaryProps = {
  overview: ReadyCreditCardOverview;
  nextInvoice?: CreditCardMonthPoint;
};

export type CreditCardPageActionsProps = {
  month: string;
  accountId?: string;
  categories?: CreditCardCategoryOption[];
  canCreatePurchase?: boolean;
  purchaseCommandId?: string | null;
};

export type CreditCardSetupCardProps = {
  title: string;
  description: string;
  action: React.ReactNode;
};

export type CreditCardTransactionRowProps = {
  accountId: string;
  categories: CreditCardTransactionsPanelProps["categories"];
  month: string;
  entry: CreditCardTransactionsPanelProps["entries"][number];
};

export type CreditCardTimelineNode = {
  point: CreditCardMonthPoint;
  /** After the current month: shown in gray with a dashed line. */
  projected: boolean;
  tone: "success" | "danger" | "neutral";
  /** Horizontal and vertical position, in percent of the strip. */
  x: number;
  y: number;
};

export type CreditCardInvoiceTileProps = {
  node: CreditCardTimelineNode;
  selected: boolean;
  onSelect: () => void;
};
