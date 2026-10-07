import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CreditCardView } from "@/components/finance/credit-card-view";
import fixtures from "../../fixtures/finance.json";
import { renderUI, freezeFinanceDate } from "../../helpers";
import { navigation } from "../../setup";

describe("credit card view states", () => {
  it("requires setup for no account and explains multiple active accounts", () => {
    const { rerender } = renderUI(
      <CreditCardView
        overview={{ state: "no_account", month: "2026-07" }}
        categories={[]}
      />,
    );
    expect(screen.getByText("Nenhum cartão configurado")).toBeVisible();
    rerender(
      <CreditCardView
        overview={{
          state: "multiple_accounts",
          month: "2026-07",
          accounts: [
            {
              id: "a",
              name: "Card 1",
              creditClosingDay: null,
              creditDueDay: 12,
            },
            { id: "b", name: "Card 2", creditClosingDay: 5, creditDueDay: 15 },
          ],
        }}
        categories={[]}
      />,
    );
    expect(screen.getByText("Mais de um cartão ativo")).toBeVisible();
    expect(screen.getByText(/Fecha dia —/)).toBeVisible();
  });
  it("opens card setup instead of a purchase form when no card exists", async () => {
    navigation.pathname = "/credit-card";
    navigation.search = new URLSearchParams(
      "month=2026-07&command=new-credit-card-purchase&commandId=card-setup",
    );
    renderUI(
      <CreditCardView
        overview={{ state: "no_account", month: "2026-07" }}
        categories={[]}
      />,
    );

    const setupDialog = await screen.findByRole("dialog", { name: "Nova conta" });
    expect(screen.getByRole("combobox", { name: "Tipo de conta" })).toHaveTextContent(
      "Cartão",
    );
    expect(setupDialog).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "Nova compra no cartão" }),
    ).not.toBeInTheDocument();
  });
  it("requires expense categories and closing configuration", () => {
    const overview = { ...fixtures.creditCard, needsConfiguration: true };
    renderUI(<CreditCardView overview={overview as never} categories={[]} />);
    expect(screen.getByText("Configure o fechamento do cartão")).toBeVisible();
    expect(screen.getByText("Cadastre categorias de despesa")).toBeVisible();
  });
  it("changes the invoice month using the month strip", async () => {
    freezeFinanceDate();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      width: 1000,
    } as DOMRect);
    navigation.pathname = "/credit-card";
    const { user } = renderUI(
      <CreditCardView
        overview={fixtures.creditCard as never}
        categories={fixtures.categories as never}
      />,
    );
    const month = screen.getByRole("button", { name: /ago.*26/i });
    expect(month).toBeDefined();
    await user.click(month!);
    expect(navigation.replace).toHaveBeenCalledWith(
      "/credit-card?month=2026-08",
    );
  });
});
