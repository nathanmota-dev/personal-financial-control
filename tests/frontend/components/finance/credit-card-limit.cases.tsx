import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreditCardsShowcase } from "@/components/finance/credit-cards-showcase";
import { DashboardCards } from "@/components/finance/dashboard-cards";
import { FinancialPrivacyContext } from "@/components/finance/privacy/privacy-context";
import { buildCreditCardLimitView } from "@/lib/credit-card-limit";
import type { CreditCardLimits } from "@/lib/interfaces/credit-card-limit";
import type { DashboardCard } from "@/lib/interfaces/dashboard-cards";
import { renderUI } from "@/tests/frontend/helpers";

const card = (id: string, name: string): DashboardCard => ({
  id, name, brand: "itau", dueDate: "2026-12-10",
  invoices: [
    { month: "2026-12", totalCents: 45918, status: null },
    { month: "2027-01", totalCents: 16634, status: null },
    { month: "2027-02", totalCents: 16634, status: null },
  ],
});

const limit = (availableCents: number) => buildCreditCardLimitView({ limitCents: 100400, availableCents, collectedOn: "2026-11-16", invoice: { month: "2026-12", totalCents: 45918, status: null } });
const showcase = (limits: CreditCardLimits = { a: limit(4580) }) => <CreditCardsShowcase cards={[card("a", "Itaú Platinum"), card("b", "Itaú Black")]} selectedId="a" month="2026-12" onSelect={vi.fn()} limits={limits} />;

describe("credit card limit", () => {
  it("shows the limit on the card and splits it below the next invoices", () => {
    renderUI(showcase());
    const [first, second] = screen.getAllByTestId("credit-card-visual");
    expect(within(first).getByTestId("credit-card-visual-limit")).toHaveTextContent(/Limite\s*R\$\s*1\.004,00/);
    expect(within(second).queryByTestId("credit-card-visual-limit")).not.toBeInTheDocument();

    const section = screen.getByRole("region", { name: "Limite do cartão" });
    expect(section).toHaveTextContent(/R\$\s*958,20 usados de R\$\s*1\.004,00\s*95%/);
    expect(within(section).getByRole("img", { name: "95% do limite usado" })).toBeVisible();
    expect(within(section).getByText("Fatura atual").closest("div")).toHaveTextContent(/R\$\s*459,18\s*45,7%/);
    expect(within(section).getByText("dezembro de 2026")).toBeVisible();
    expect(within(section).getByText("Comprometido").closest("div")).toHaveTextContent(/R\$\s*499,02/);
    expect(within(section).getByText("Disponível").closest("div")).toHaveTextContent(/R\$\s*45,80\s*4,6%/);
    expect(section).toHaveTextContent("Limite informado pelo banco em 16/11/2026.");
    expect(section.querySelector('[data-segment="invoice"]')).toHaveStyle({ width: "45.7%" });
  });

  it("hides the limit when the bank reported none", () => {
    renderUI(showcase({}));
    expect(screen.queryByRole("region", { name: "Limite do cartão" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("credit-card-visual-limit")).not.toBeInTheDocument();
  });

  it("marks a card above its limit", () => {
    renderUI(showcase({ a: limit(-2500) }));
    const section = screen.getByRole("region", { name: "Limite do cartão" });
    expect(within(section).getByText("Disponível").closest("div")?.querySelector("dd")).toHaveClass("text-destructive");
  });

  it("protects amounts and percentages in privacy mode", () => {
    const { container } = renderUI(<FinancialPrivacyContext value={{ hidden: true, setHidden: vi.fn() }}>{showcase()}</FinancialPrivacyContext>);
    const section = screen.getByRole("region", { name: "Limite do cartão" });
    expect(section).not.toHaveTextContent(/R\$\s*\d|\d%/);
    expect(container.querySelector('[data-testid="credit-card-visual-limit"]')).not.toHaveTextContent(/\d/);
  });

  it("keeps the dashboard card without a limit", () => {
    renderUI(<DashboardCards cards={[card("a", "Itaú Platinum")]} month="2026-12" />);
    expect(screen.queryByTestId("credit-card-visual-limit")).not.toBeInTheDocument();
  });
});
