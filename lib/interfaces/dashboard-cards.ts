import type { ReactNode } from "react";

export type CardBrandId =
  | "itau"
  | "bradesco"
  | "nubank"
  | "bb"
  | "santander"
  | "mercadopago"
  | "inter"
  | "amex"
  | "generic";

export type CardBrandTheme = {
  id: CardBrandId;
  label: string;
  /** Tailwind arbitrary background classes for the card face. */
  faceClassName: string;
  /** Text colour used on the card face. */
  textClassName: string;
  /** Badge ("Aberta") colours tuned for the face. */
  badgeClassName: string;
  /** Matches the brand in the account name (lower-cased, accent-free). */
  pattern: RegExp;
};

export type DashboardCardInvoice = {
  month: string;
  totalCents: number;
  status: "open" | "paid" | null;
};

export type DashboardCard = {
  id: string;
  name: string;
  brand: CardBrandId;
  dueDate: string;
  /** First invoice shown (the selected month, or the next one once the current month is past due) followed by the next ones. */
  invoices: DashboardCardInvoice[];
};

export type DashboardCardsData = DashboardCard[];

export type DashboardCardsProps = {
  cards: DashboardCardsData;
  month: string;
};

export type CreditCardVisualDetail = { label: string; value: string };

export type CreditCardVisualProps = {
  card: DashboardCard;
  className?: string;
  /** Replaces the due date and invoice shown in the bottom corners. */
  details?: [CreditCardVisualDetail, CreditCardVisualDetail];
  /** Replaces the invoice status badge; `null` hides it. */
  statusLabel?: string | null;
};

export type CreditCardBrandLogoProps = {
  brand: CardBrandId;
  name: string;
};

export type CreditCardInvoiceChartProps = {
  invoices: DashboardCardInvoice[];
};

export type DashboardCardsHeaderProps = {
  monthLabel: string;
  totalCents: number;
  /** Invoice month opened by "Ver fatura". */
  month: string;
  cardId: string;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export type DashboardCardsMoneyProps = { cents: number; className?: string };

export type CardChipProps = { className?: string; children?: ReactNode };
