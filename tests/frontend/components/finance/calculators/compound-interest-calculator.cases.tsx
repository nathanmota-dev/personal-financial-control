import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompoundInterestCalculator } from "@/components/finance/calculators/compound-interest-calculator";
import { renderUI } from "../../../helpers";

const storageKey = "personal-financial-control:compound-interest";
function fill(initial = "1000", monthly = "100", rate = "0", period = "1") {
  fireEvent.change(screen.getByLabelText("Valor inicial"), {
    target: { value: initial },
  });
  fireEvent.change(screen.getByLabelText("Valor mensal"), {
    target: { value: monthly },
  });
  fireEvent.change(screen.getByLabelText("Taxa de juros"), {
    target: { value: rate },
  });
  fireEvent.change(screen.getByLabelText("Período"), {
    target: { value: period },
  });
}

describe("compound interest calculator", () => {
  it("calculates, displays the monthly table, persists values and clears", async () => {
    const { user } = renderUI(<CompoundInterestCalculator />);
    await user.click(screen.getByRole("button", { name: "Calcular" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Preencha todos os campos",
    );
    fill();
    await user.click(screen.getByRole("button", { name: "Calcular" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByText("Valor total final").closest('[data-slot="card"]'),
    ).toHaveTextContent("R$ 22,00");
    // MoneyInput applies a cents mask: 1000 => 10,00 and 100 => 1,00.
    await user.click(screen.getByRole("tab", { name: "Tabela" }));
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      14,
    );
    expect(JSON.parse(localStorage.getItem(storageKey)!)).toMatchObject({
      initialAmount: "10,00",
      monthlyContribution: "1,00",
    });
    await user.click(screen.getByRole("button", { name: "Limpar" }));
    expect(screen.queryByText("Valor total final")).toBeNull();
    expect(screen.getByLabelText("Valor inicial")).toHaveValue("");
    expect(localStorage.getItem(storageKey)).toBeNull();
  });
  it("switches rate and period units through the real selects", async () => {
    const { user } = renderUI(<CompoundInterestCalculator />);
    fill("100000", "0", "1", "2");
    const selects = screen.getAllByRole("combobox");
    await user.click(selects[0]);
    await user.click(screen.getByRole("option", { name: "mensal" }));
    await user.click(selects[1]);
    await user.click(screen.getByRole("option", { name: "meses" }));
    await user.click(screen.getByRole("button", { name: "Calcular" }));
    expect(
      screen.getByText("Valor total final").closest('[data-slot="card"]'),
    ).toHaveTextContent("R$ 1.020,10");
    expect(
      screen.getByText("Total em juros").closest('[data-slot="card"]'),
    ).toHaveTextContent("R$ 20,10");
  });
  it.each([
    ["0", "0", "0", "1", "maior que zero"],
    ["100", "0", "101", "1", "entre 0% e 100%"],
    ["100", "0", "bad", "1", "entre 0% e 100%"],
    ["100", "0", "1", "51", "entre 1 e 50 anos"],
    ["100", "0", "1", "1.5", "entre 1 e 50 anos"],
  ])(
    "validates financial inputs (%s, %s, %s, %s)",
    (initial, monthly, rate, period, message) => {
      renderUI(<CompoundInterestCalculator />);
      fill(initial, monthly, rate, period);
      fireEvent.submit(
        screen.getByRole("button", { name: "Calcular" }).closest("form")!,
      );
      expect(screen.getByRole("alert")).toHaveTextContent(message);
      expect(localStorage.getItem(storageKey)).toBeNull();
    },
  );
  it("restores a valid saved simulation and discards corrupt data", async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        initialAmount: "1000,00",
        monthlyContribution: "100,00",
        interestRate: "0",
        interestRatePeriod: "annual",
        investmentPeriod: "1",
        investmentPeriodUnit: "years",
      }),
    );
    const { unmount } = renderUI(<CompoundInterestCalculator />);
    await waitFor(() =>
      expect(screen.getByLabelText("Valor inicial")).toHaveValue("1.000,00"),
    );
    expect(
      screen.getByText("Valor total final").closest('[data-slot="card"]'),
    ).toHaveTextContent("R$ 2.200,00");
    unmount();
    localStorage.setItem(storageKey, "{invalid");
    renderUI(<CompoundInterestCalculator />);
    await waitFor(() => expect(localStorage.getItem(storageKey)).toBeNull());
    expect(screen.getByLabelText("Valor inicial")).toHaveValue("");
  });
});
