import { formatMonthLabel } from "@/lib/finance-ui";
import type { CreditCardLimitInput, CreditCardLimitSegment, CreditCardLimitView } from "@/lib/interfaces/credit-card-limit";

/** The current invoice never counts for more than what the bank reports as used, so the parts add up to the limit. */
export function buildCreditCardLimitView({ limitCents, availableCents, collectedOn, invoice }: CreditCardLimitInput): CreditCardLimitView {
  const usedCents = Math.max(0, limitCents - availableCents);
  const currentInvoiceCents = Math.min(Math.max(invoice.totalCents, 0), usedCents);
  return {
    limitCents,
    availableCents,
    usedCents,
    currentInvoiceMonth: invoice.month,
    currentInvoiceCents,
    committedCents: usedCents - currentInvoiceCents,
    collectedOn,
  };
}

function share(cents: number, totalCents: number) {
  return totalCents > 0 ? Math.round((Math.max(cents, 0) / totalCents) * 1000) / 10 : 0;
}

/** Above the limit the bar is scaled to what is used, so it never overflows. */
export function creditCardLimitSegments(view: CreditCardLimitView): CreditCardLimitSegment[] {
  const scale = Math.max(view.limitCents, view.usedCents);
  const segments: Omit<CreditCardLimitSegment, "percent" | "width">[] = [
    { key: "invoice", label: "Fatura atual", hint: formatMonthLabel(view.currentInvoiceMonth), amountCents: view.currentInvoiceCents, colorClassName: "bg-chart-1" },
    { key: "committed", label: "Comprometido", hint: "parcelas de faturas futuras", amountCents: view.committedCents, colorClassName: "bg-chart-3" },
    { key: "available", label: "Disponível", hint: "para novas compras", amountCents: view.availableCents, colorClassName: "bg-success" },
  ];
  return segments.map((segment) => ({
    ...segment,
    percent: share(segment.amountCents, view.limitCents),
    width: share(segment.amountCents, scale),
  }));
}

export function creditCardLimitUsedPercent(view: CreditCardLimitView) {
  return view.limitCents > 0 ? Math.round((view.usedCents / view.limitCents) * 100) : 0;
}

export function formatLimitPercent(percent: number) {
  return `${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
