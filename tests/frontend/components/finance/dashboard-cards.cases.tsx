import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardCards } from "@/components/finance/dashboard-cards";
import { detectCardBrand } from "@/lib/credit-card-brands";
import { buildDashboardCard, cardProductName, resolveOpenInvoiceMonth } from "@/lib/dashboard-cards";
import type { DashboardCard } from "@/lib/interfaces/dashboard-cards";
import { renderUI } from "@/tests/frontend/helpers";

const MONTHS = ["2026-12", "2027-01", "2027-02"];

function card(id: string, name: string, totals: number[]): DashboardCard {
  return {
    id, name, brand: detectCardBrand(name), dueDate: "2026-12-05",
    invoices: totals.map((totalCents, index) => ({ month: MONTHS[index], totalCents, status: index === 0 ? "open" : null })),
  };
}

describe("dashboard cards", () => {
  it.each([
    ["Santander Unique", "santander"], ["Itaú Platinum", "itau"], ["Nubank", "nubank"],
    ["Bradesco Visa", "bradesco"], ["Banco do Brasil Ourocard", "bb"], ["Mercado Pago", "mercadopago"],
    ["Banco Inter", "inter"], ["American Express Gold", "amex"], ["Cartão XP", "generic"],
  ])("detects %s as %s", (name, brand) => expect(detectCardBrand(name)).toBe(brand));

  it("builds three invoices where a bill overrides the computed total and sets the due date", () => {
    const built = buildDashboardCard({
      account: { id: "a", name: "Nubank", creditDueDay: 31 }, month: "2026-02",
      totalsByMonth: new Map([["2026-02", 100], ["2026-03", 500]]),
      billRows: [{ invoiceMonth: "2026-02", dueDate: "2026-02-27", statementTotalCents: 900, status: "paid" }],
    });
    expect(built.invoices.map((item) => [item.month, item.totalCents, item.status])).toEqual([["2026-02", 900, "paid"], ["2026-03", 500, null], ["2026-04", 0, null]]);
    expect(built.dueDate).toBe("2026-02-27");
  });

  it.each([
    ["Santander Unique", "santander", "Unique"], ["Itaú", "itau", ""], ["Cartão XP", "generic", ""], ["Nubank Ultravioleta", "nubank", "Ultravioleta"],
  ] as const)("shows %s product name as %j", (name, brand, product) => expect(cardProductName(name, brand)).toBe(product));

  it("clamps the due day to the month length without a bill", () => {
    const built = buildDashboardCard({ account: { id: "a", name: "X", creditDueDay: 31 }, month: "2026-02", totalsByMonth: new Map(), billRows: [] });
    expect(built.dueDate).toBe("2026-02-28");
  });

  it("shows the active card invoice and switches cards with the arrows", async () => {
    const { user } = renderUI(<DashboardCards month="2026-12" cards={[card("1", "Santander Unique", [799970, 929970, 1001970]), card("2", "Itaú", [12345, 0, 0])]} />);
    expect(screen.getByText("Fatura de dezembro")).toBeVisible();
    expect(screen.getAllByTestId("credit-card-visual")).toHaveLength(2);
    expect(screen.getByTestId("credit-card-invoice-chart")).toHaveTextContent("Aberta");
    await user.click(screen.getByRole("button", { name: "Próximo cartão" }));
    expect(screen.getByRole("button", { name: "Próximo cartão" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Ver fatura" })).toHaveAttribute("href", "/credit-card?month=2026-12&card=2");
  });

  it("titles the header with the active card's first invoice, which can follow the dashboard month", () => {
    renderUI(<DashboardCards month="2026-11" cards={[card("1", "Nubank", [5000, 0, 0])]} />);
    expect(screen.getByText("Fatura de dezembro")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver fatura" })).toHaveAttribute("href", "/credit-card?month=2026-12&card=1");
  });

  it.each([
    ["2026-11-10", 10, undefined, "2026-11"],
    ["2026-11-13", 10, undefined, "2026-12"],
    ["2026-12-13", 10, undefined, "2027-01"],
    ["2026-02-28", 31, undefined, "2026-02"],
    ["2026-11-13", 10, "2026-11-20", "2026-11"],
  ] as const)("on %s with due day %i (bill due %s) the open invoice is %s", (today, dueDay, billDueDate, expected) => {
    expect(resolveOpenInvoiceMonth(today, dueDay, billDueDate)).toBe(expected);
  });
});
