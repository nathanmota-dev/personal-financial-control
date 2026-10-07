import { describe, expect, it } from "vitest";
import {
  buildFinanceCommandHref,
  FINANCE_COMMAND_ACTIONS,
  matchesFinanceCommand,
} from "@/lib/finance-command-catalog";
import { getFinancePageDestinations } from "@/lib/finance-navigation";

describe("finance command catalog", () => {
  it("matches Portuguese aliases without case or accent differences", () => {
    expect(matchesFinanceCommand("Lançamentos nova despesa", "lancamento")).toBe(true);
    expect(matchesFinanceCommand("Cartão de crédito", "CARTAO")).toBe(true);
    expect(matchesFinanceCommand("Reserva de emergência", "reserva")).toBe(true);
    expect(matchesFinanceCommand("Nova receita", "despesa")).toBe(false);
  });

  it("shares the live sidebar destinations with the command menu", () => {
    const destinations = getFinancePageDestinations();
    expect(destinations.map((destination) => destination.href)).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/transactions",
        "/credit-card",
        "/budgets",
        "/reports",
        "/calculators/compound-interest",
        "/settings",
        "/help",
      ]),
    );
    expect(
      destinations.some((destination) =>
        matchesFinanceCommand(
          `${destination.label} ${destination.aliases.join(" ")}`,
          "reserva",
        ),
      ),
    ).toBe(true);
  });

  it("preserves only a valid monthly competence when navigating or opening an action", () => {
    expect(
      buildFinanceCommandHref(
        "/transactions",
        "month=2026-08&categoryId=abc&section=transfers",
        "new-expense",
        "request-1",
      ),
    ).toBe("/transactions?month=2026-08&command=new-expense&commandId=request-1");
    expect(
      buildFinanceCommandHref("/credit-card", "month=invalid", "new-credit-card-purchase", "request-2"),
    ).toBe("/credit-card?command=new-credit-card-purchase&commandId=request-2");
    expect(buildFinanceCommandHref("/goals", "month=2026-08")).toBe("/goals");
  });

  it("defines the requested non-destructive create actions", () => {
    expect(FINANCE_COMMAND_ACTIONS.map((action) => action.id)).toEqual([
      "new-income",
      "new-expense",
      "new-transfer",
      "new-credit-card-purchase",
      "new-account",
      "new-category",
      "new-goal",
    ]);
  });
});
