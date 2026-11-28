import { screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { InvestmentContributionChart } from "@/components/finance/investment-contribution-chart";
import type { InvestmentContributionHistory } from "@/lib/interfaces/investments";
import { renderUI } from "../../helpers";

const history = (bankBackfill: InvestmentContributionHistory["bankBackfill"]): InvestmentContributionHistory => ({
  totalContributionCents: 300_000,
  totalWithdrawalCents: 50_000,
  bankBackfill,
  points: [{ month: "2026-01", monthlyContributionCents: 300_000, monthlyWithdrawalCents: 50_000, cumulativeNetMovementCents: 250_000 }],
});

it("says how much of the contributions came from the bank's positions", () => {
  renderUI(<InvestmentContributionChart history={history({ positionsCents: 180_000, adjustmentCents: 20_000, recordedSince: "2026-05-05" })} />);
  expect(screen.getByText(/investimentos do banco pela data de compra/)).toBeVisible();
  expect(screen.getByText("R$ 2.000,00 informados pelo banco")).toBeVisible();
});

it("keeps the recorded-only description without bank positions", () => {
  renderUI(<InvestmentContributionChart history={history(null)} />);
  expect(screen.getByText("Histórico dos lançamentos realizados, sem misturar rendimento estimado")).toBeVisible();
  expect(screen.queryByText(/informados pelo banco/)).toBeNull();
});
