import type { DashboardCard, DashboardCardInvoice } from "@/lib/interfaces/dashboard-cards";
import type { BuildDashboardCardInput } from "@/lib/interfaces/dashboard-cards-build";
import { CARD_BRAND_THEMES, detectCardBrand } from "@/lib/credit-card-brands";
import type { CardBrandId } from "@/lib/interfaces/dashboard-cards";

export const DASHBOARD_CARD_INVOICE_COUNT = 3;

export function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function resolveDueDate(month: string, dueDay: number, billDueDate?: string) {
  if (billDueDate) return billDueDate;
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(Math.min(dueDay, lastDay)).padStart(2, "0")}`;
}

/** Invoice still to be paid on `today`: the current month's until its due date, then the next one. */
export function resolveOpenInvoiceMonth(today: string, dueDay: number, billDueDate?: string) {
  const month = today.slice(0, 7);
  return today > resolveDueDate(month, dueDay, billDueDate) ? shiftMonth(month, 1) : month;
}

export function buildDashboardCard({ account, month, totalsByMonth, billRows }: BuildDashboardCardInput): DashboardCard {
  const bills = new Map(billRows.map((row) => [row.invoiceMonth, row]));
  const invoices: DashboardCardInvoice[] = Array.from(
    { length: DASHBOARD_CARD_INVOICE_COUNT },
    (_, index) => {
      const invoiceMonth = shiftMonth(month, index);
      const bill = bills.get(invoiceMonth);
      return {
        month: invoiceMonth,
        totalCents: bill?.statementTotalCents ?? totalsByMonth.get(invoiceMonth) ?? 0,
        status: bill?.status ?? null,
      };
    },
  );
  return {
    id: account.id,
    name: account.name,
    brand: detectCardBrand(account.name),
    dueDate: resolveDueDate(month, account.creditDueDay, bills.get(month)?.dueDate),
    invoices,
  };
}

export function formatCardDueDate(dueDate: string) {
  const [, month, day] = dueDate.split("-");
  return `${day}/${month}`;
}

export function splitCurrency(text: string) {
  const index = text.lastIndexOf(",");
  if (index < 0) return { main: text, cents: "" };
  return { main: text.slice(0, index), cents: text.slice(index) };
}

const longMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

export function longMonthName(month: string) {
  return longMonth.format(new Date(`${month}-01T00:00:00Z`));
}

export function invoiceTileLabel(month: string, selected: boolean) {
  const raw = shortMonth.format(new Date(`${month}-01T00:00:00Z`)).replace(".", "");
  const name = raw.charAt(0).toUpperCase() + raw.slice(1);
  return selected ? name : `${name} ${month.slice(2, 4)}`;
}

/** Product line shown on the card face ("Santander Unique" -> "Unique"); generic cards show none. */
export function cardProductName(name: string, brand: CardBrandId) {
  if (brand === "generic") return "";
  const { pattern, label } = CARD_BRAND_THEMES[brand];
  const withoutBrand = name.replace(new RegExp(pattern.source, "gi"), " ").replace(new RegExp(label, "gi"), " ");
  return withoutBrand.replace(/\s+/g, " ").trim();
}
