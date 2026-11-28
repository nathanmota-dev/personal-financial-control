import { screen, within } from "@testing-library/react";
import { expect, it } from "vitest";

import { InvestmentHistorySection } from "@/components/finance/investment-history-section";
import { renderUI } from "@/tests/frontend/helpers";
import { investmentHistoryFixture } from "../../fixtures/investment-history";

const value = (region: HTMLElement, label: string) => within(region).getByText(label, { selector: "dt" }).nextElementSibling?.textContent;

it("shows the patrimony against the invested capital and rebases it on the chosen period", async () => {
  const { user } = renderUI(<InvestmentHistorySection history={investmentHistoryFixture} />);
  const evolution = screen.getByRole("region", { name: "Evolução do patrimônio" });
  expect(value(evolution, "Patrimônio")).toContain("21.700,00");
  // Twelve months back the ETF did not exist yet, so its R$ 3.800,00 is capital and not yield.
  expect(value(evolution, "Capital aplicado")).toContain("19.500,00");
  expect(value(evolution, "Rendimento")).toContain("2.200,00");
  expect(within(evolution).getByRole("radio", { name: "12M" })).toHaveAttribute("data-state", "on");
  await user.click(within(evolution).getByRole("radio", { name: "Tudo" }));
  expect(within(evolution).getByRole("radio", { name: "Tudo" })).toHaveAttribute("data-state", "on");
  expect(value(evolution, "Capital aplicado")).toContain("19.500,00");
  const monthly = screen.getByRole("region", { name: "Rendimento mensal" });
  expect(value(monthly, "Pior mês")).toContain("-");
  const benchmarks = screen.getByRole("region", { name: "Rentabilidade vs índices" });
  expect(value(benchmarks, "% do CDI")).toMatch(/%$/);
  expect(within(benchmarks).queryByRole("status")).toBeNull();
});

it("explains which indexes could not be read", () => {
  renderUI(<InvestmentHistorySection history={{ ...investmentHistoryFixture, benchmarks: { cdi: null, ipca: investmentHistoryFixture.benchmarks.ipca, ibov: null } }} />);
  const benchmarks = screen.getByRole("region", { name: "Rentabilidade vs índices" });
  expect(within(benchmarks).getByRole("status")).toHaveTextContent("Índices indisponíveis no momento: CDI, Ibovespa.");
  expect(value(benchmarks, "% do CDI")).toBe("—");
});

it("waits for a second month before drawing the charts", () => {
  renderUI(<InvestmentHistorySection history={{ points: investmentHistoryFixture.points.slice(0, 1), benchmarks: { cdi: null, ipca: null, ibov: null } }} />);
  expect(screen.getByText("Histórico em formação")).toBeVisible();
  expect(screen.queryByRole("region", { name: "Rendimento mensal" })).toBeNull();
});
