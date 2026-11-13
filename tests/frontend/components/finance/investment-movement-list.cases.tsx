import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";

import { InvestmentMovementList } from "@/components/finance/investment-movement-list";
import { renderUI } from "../../helpers";

const point = (month: string, contribution: number, withdrawal: number) => ({ month, monthlyContributionCents: contribution, monthlyWithdrawalCents: withdrawal, cumulativeNetMovementCents: 0 });

it("lists the chart's months with movement, newest first, with the net of each month", () => {
  renderUI(<InvestmentMovementList history={{ totalContributionCents: 300_000, totalWithdrawalCents: 50_000, points: [point("2026-08", 100_000, 0), point("2026-09", 0, 0), point("2026-10", 200_000, 50_000)] }} />);
  const card = screen.getByRole("region", { name: "Aportes e resgates por mês" });
  const rows = within(card).getAllByRole("listitem");
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent(/out.*2026/i);
  expect(rows[0]).toHaveTextContent("Líquido R$ 1.500,00");
  expect(rows[0]).toHaveTextContent("− R$ 500,00");
  expect(rows[1]).toHaveTextContent("R$ 1.000,00");
  expect(within(rows[1]).queryByText("Resgatado")).toBeNull();
});

it("shows an empty state without movements", () => {
  renderUI(<InvestmentMovementList history={{ totalContributionCents: 0, totalWithdrawalCents: 0, points: [] }} />);
  expect(screen.getByText("Nenhuma movimentação")).toBeVisible();
});
