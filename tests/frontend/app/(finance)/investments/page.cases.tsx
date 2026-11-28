import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import Page from "@/app/(finance)/investments/page";
import { requirePageSession } from "@/lib/auth/server";
import { getInvestmentHistory } from "@/lib/server/investment-operations";
import { renderUI } from "@/tests/frontend/helpers";
it("app/(finance)/investments/page presents its authorized content", async () => {
  renderUI(await Page());
  expect(requirePageSession).toHaveBeenCalled();
  expect(getInvestmentHistory).toHaveBeenCalled();
  expect(screen.getByRole("heading", { name: "Investimentos" })).toBeVisible();
  for (const name of ["Evolução do patrimônio", "Rendimento mensal", "Rentabilidade vs índices"]) {
    expect(within(screen.getByRole("region", { name })).getByRole("heading", { name })).toBeVisible();
  }
});
