import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { IncomeDeductions } from "@/components/finance/calculators/income-deductions";
import { FinancialPrivacyContext } from "@/components/finance/privacy/privacy-context";
import { calculateNetSalary } from "@/lib/net-salary";
import { renderUI } from "@/tests/frontend/helpers";

const salary = { grossCents: 600000, dependents: 0, discountsCents: 0, benefitsCents: 10000 };
it("shows grouped deductions and a separate employer FGTS deposit", () => {
  renderUI(<IncomeDeductions result={calculateNetSalary(salary)} />);
  expect(screen.getByRole("heading", { name: "Descontos em detalhe" })).toBeVisible();
  expect(screen.getByText("FGTS estimado · 8%")).toBeVisible();
  expect(screen.getByText("R$ 480,00")).toBeVisible();
  expect(screen.getByText(/sem desconto no seu salário/)).toBeVisible();
  expect(screen.getByRole("list", { name: "Legenda dos descontos" })).toHaveTextContent("INSS");
});
it("explains an empty pie without drawing fictitious deductions", () => {
  renderUI(<IncomeDeductions result={calculateNetSalary({ ...salary, grossCents: 0 })} />);
  expect(screen.getByText("Nenhum desconto nesta simulação.")).toBeVisible();
  expect(screen.queryByRole("list", { name: "Legenda dos descontos" })).toBeNull();
});
it("hides breakdown amounts, percentages and pie in privacy mode", () => {
  const view = renderUI(<FinancialPrivacyContext value={{ hidden: true, setHidden: vi.fn() }}><IncomeDeductions result={calculateNetSalary(salary)} /></FinancialPrivacyContext>);
  expect(screen.getByText("Composição dos descontos oculta para proteger os valores financeiros.")).toBeVisible();
  expect(view.container).not.toHaveTextContent("480,00");
  expect(view.container).not.toHaveTextContent(/\d+,\d% dos descontos/);
  expect(screen.queryByRole("list", { name: "Legenda dos descontos" })).toBeNull();
});
