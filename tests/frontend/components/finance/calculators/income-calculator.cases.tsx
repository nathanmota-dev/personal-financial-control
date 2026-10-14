import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { IncomeCalculator } from "@/components/finance/calculators/income-calculator";
import { IncomeChart } from "@/components/finance/calculators/income-chart";
import { FinancialPrivacyContext } from "@/components/finance/privacy/privacy-context";
import { calculateNetSalary } from "@/lib/net-salary";
import { EMPTY_INCOME_VALUES } from "@/lib/income-simulation";
import CltPage from "@/app/(finance)/calculators/net-salary/page";
import PjPage from "@/app/(finance)/calculators/pj-income/page";
import CltLoading from "@/app/(finance)/calculators/net-salary/loading";
import PjLoading from "@/app/(finance)/calculators/pj-income/loading";
import { requirePageSession } from "@/lib/auth/server";
import { renderUI } from "@/tests/frontend/helpers";
const key = "personal-financial-control:net-salary:2026";
function change(label: string, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function click(name: string) { fireEvent.click(screen.getByRole("button", { name })); }

it("CLT conditional fields, negative result, persistence, clearing and validation", async () => {
  const view = renderUI(<IncomeCalculator />);
  click("Calcular"); expect(screen.getByRole("alert")).toHaveTextContent("Preencha");
  change("Remuneração bruta", "162100"); change("Dependentes fiscais", "1"); change("Benefícios não tributáveis", "20000"); change("Descontos adicionais", "300000");
  fireEvent.click(screen.getByLabelText("Incluir horas extras")); change("Quantidade de horas extras", "10");
  fireEvent.click(screen.getByLabelText("Incluir salário-família")); change("Dependentes elegíveis ao salário-família", "2");
  click("Calcular"); expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("table")).toHaveTextContent("Salário-família"); expect(screen.getByText(/Os descontos excederam/)).toBeVisible();
  expect(localStorage.getItem(key)).toContain("1.621,00");
  view.unmount(); renderUI(<IncomeCalculator />);
  await waitFor(() => expect(screen.getByLabelText("Remuneração bruta")).toHaveValue("1.621,00"));
  click("Limpar"); expect(localStorage.getItem(key)).toBeNull(); expect(screen.queryByRole("table")).toBeNull();
  change("Remuneração bruta", "100000"); change("Dependentes fiscais", "9"); fireEvent.submit(screen.getByRole("button", { name: "Calcular" }).closest("form")!); expect(screen.getByRole("alert")).toHaveTextContent("0 a 8");
});
it("PJ changes regimes, manual DAS, activities, dependents and default pro-labore", async () => {
  const user = userEvent.setup();
  async function select(label: string, option: string) {
    await user.click(screen.getByRole("combobox", { name: label }));
    await user.click(screen.getByRole("option", { name: option }));
  }
  renderUI(<IncomeCalculator pj />);
  expect(screen.queryByLabelText("Dependentes fiscais")).toBeNull();
  change("Receita bruta mensal", "500000"); change("Pró-labore", "100000"); change("Dependentes fiscais", "2");
  await select("Atividade", "Comércio e serviços"); click("Calcular"); expect(screen.getByRole("table")).toHaveTextContent("87,05");
  await select("Atividade", "Comércio / Indústria"); click("Calcular"); expect(screen.getByRole("table")).toHaveTextContent("82,05");
  await select("Regime tributário", "Simples Nacional"); await select("Ramo de atividade", "Anexo IV — Serviços específicos");
  fireEvent.click(screen.getByLabelText("Informar DAS manualmente")); click("Calcular"); expect(screen.getByRole("alert")).toHaveTextContent("manual");
  change("Alíquota do DAS (%)", "10"); click("Calcular"); expect(screen.getByText("Líquido parcial estimado")).toBeVisible();
  fireEvent.click(screen.getByLabelText("Informar DAS manualmente")); click("Calcular"); expect(screen.getByText("Líquido mensal estimado")).toBeVisible();
  await select("Regime tributário", "Lucro Presumido"); await select("Atividade", "Outras atividades"); click("Calcular"); expect(screen.getByRole("table")).toHaveTextContent("CSLL");
  expect(screen.getByText("Líquido parcial estimado")).toBeVisible();
  await select("Atividade", "Serviços"); click("Calcular"); expect(screen.getByText("Líquido mensal estimado")).toBeVisible();
});
it("restores PJ and rejects malformed saved simulations", async () => {
  localStorage.setItem("personal-financial-control:pj-income:2026", JSON.stringify({ ...EMPTY_INCOME_VALUES, gross: "5000" }));
  const view = renderUI(<IncomeCalculator pj />);
  await waitFor(() => expect(screen.getByRole("table")).toHaveTextContent("DAS MEI"));
  view.unmount(); localStorage.setItem(key, "null"); renderUI(<IncomeCalculator />);
  await waitFor(() => expect(localStorage.getItem(key)).toBeNull());
});
it("works without local storage access", async () => {
  vi.spyOn(Storage.prototype,"getItem").mockImplementation(() => { throw new Error("unavailable"); });
  vi.spyOn(Storage.prototype,"removeItem").mockImplementation(() => { throw new Error("unavailable"); });
  vi.spyOn(Storage.prototype,"setItem").mockImplementation(() => { throw new Error("unavailable"); });
  renderUI(<IncomeCalculator />);
  await new Promise(resolve => setTimeout(resolve,10));
  change("Remuneração bruta", "500000"); click("Calcular"); expect(screen.getByRole("table")).toBeVisible();
  click("Limpar"); expect(screen.queryByRole("table")).toBeNull();
});
it("protects the form, result values, notes and graph in privacy mode", () => {
  const result = calculateNetSalary({ grossCents: 500000, dependents: 0, discountsCents: 0, benefitsCents: 0 });
  renderUI(<FinancialPrivacyContext value={{ hidden: true, setHidden: vi.fn() }}><IncomeChart result={result} /><IncomeCalculator /></FinancialPrivacyContext>);
  expect(screen.getByText("Gráfico oculto para proteger os valores financeiros.")).toBeVisible();
  expect(screen.queryByLabelText("Remuneração bruta")).toBeNull(); click("Mostrar valores para editar");
  change("Remuneração bruta", "500000"); click("Calcular");
  expect(screen.getByRole("table")).not.toHaveTextContent("5.000,00");
  expect(screen.queryByText(/IRRF: dedução/)).toBeNull();
});
it("new routes require authentication and loading components render", async () => {
  const view = renderUI(await CltPage()); expect(requirePageSession).toHaveBeenCalled(); expect(screen.getByRole("heading",{name:"Salário líquido CLT"})).toBeVisible();
  view.unmount(); const pjView = renderUI(await PjPage()); expect(screen.getByRole("heading",{name:"Renda PJ"})).toBeVisible(); pjView.unmount();
  const loading = renderUI(<><CltLoading /><PjLoading /></>); expect(loading.container).not.toBeEmptyDOMElement();
});
