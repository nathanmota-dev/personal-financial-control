import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExpenseGroupsView } from "@/components/finance/reports/expense-groups-view";
import { ExpenseGroupsChart } from "@/components/finance/reports/expense-groups-chart";
import { FinancialPrivacyContext } from "@/components/finance/privacy/privacy-context";
import { buildExpenseGroupsReport } from "@/lib/expense-groups";
import { expenseGroupRecords } from "@/tests/helpers/expense-groups";
import { renderUI } from "@/tests/frontend/helpers";

const report = () => buildExpenseGroupsReport(expenseGroupRecords(), ["2026-06"]);

describe("expense groups interface", () => {
  it("shows amounts, shares, sorted sources, totals and recurring warnings", () => {
    renderUI(<ExpenseGroupsView report={report()} mode="monthly" />);
    const cards = screen.getByRole("region", { name: "Totais por grupo de despesa" });
    expect(cards).toHaveTextContent(/Gastos fixos.*3.200,00.*64,0%/);
    expect(cards).toHaveTextContent(/Gastos variáveis.*1.800,00.*36,0%/);
    expect(cards).toHaveTextContent(/Sem classificação.*0,00.*0,0%/);
    expect(screen.getByText(/1 gasto recorrente está em categoria variável/)).toBeVisible();
    const fixed = screen.getByRole("region", { name: "Gastos fixos" });
    const variable = screen.getByRole("region", { name: "Gastos variáveis" });
    expect(within(fixed).getByRole("table").querySelector("tfoot")).toHaveTextContent(/Total.*3.200,00/);
    const rows = within(variable).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Mercado");
    expect(rows[2]).toHaveTextContent(/Compra parcelada.*Parcela de cartão.*20\/05\/2026/);
    expect(rows[3]).toHaveTextContent(/Estorno.*-R\$\s*100,00/);
    expect(within(variable).getAllByText("Mercado")[0]).toHaveAttribute("data-user-content");
    expect(screen.queryByRole("region", { name: "Sem classificação" })).not.toBeInTheDocument();
    expect(screen.getByText(/Total geral:/)).toHaveTextContent("5.000,00");
    expect(within(variable).getByRole("list")).toHaveClass("md:hidden");
  });
  it("shows unclassified details even when their signed amounts cancel out", () => {
    const records = expenseGroupRecords();
    records.expenses = [{ ...records.expenses[0], category: null, account: null }, { ...records.expenses[0], id: "credit", category: null, amountCents: -320000 }];
    const data = buildExpenseGroupsReport(records, ["2026-06"]);
    renderUI(<ExpenseGroupsView report={data} mode="monthly" />);
    expect(screen.getByRole("region", { name: "Sem classificação" })).toHaveTextContent(/Sem categoria.*Conta ausente/);
    expect(screen.getAllByText(/Sem despesas neste grupo/)).toHaveLength(2);
    expect(screen.getByText("Distribuição indisponível")).toBeVisible();
    expect(screen.getAllByText(/— do total/)).toHaveLength(3);
    expect(screen.queryByText(/gasto recorrente está em categoria variável/)).not.toBeInTheDocument();
  });
  it("shows a genuine empty state for a period without expenses", () => {
    renderUI(<ExpenseGroupsView report={buildExpenseGroupsReport(expenseGroupRecords(), [])} mode="annual" />);
    expect(screen.getByText("Sem despesas no período")).toBeVisible();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Distribuição dos gastos" })).not.toBeInTheDocument();
  });
  it("groups annual details by category with occurrences and group shares", () => {
    renderUI(<ExpenseGroupsView report={report()} mode="annual" />);
    const variable = screen.getByRole("region", { name: "Gastos variáveis" });
    expect(within(variable).getByRole("columnheader", { name: "Ocorrências" })).toBeVisible();
    expect(within(variable).getAllByRole("row")[1]).toHaveTextContent(/Alimentação.*3.*1.800,00.*100,0%/);
    expect(within(variable).getByRole("table").querySelector("tfoot")).toHaveTextContent(/Total.*1.800,00/);
    expect(within(variable).queryByText("Compra parcelada")).not.toBeInTheDocument();
    expect(screen.getByText(/Gastos líquidos por competência/)).toBeVisible();
  });
  it.each(["monthly", "annual"] as const)("protects amounts, percentages and charts in %s privacy mode", (mode) => {
    const { container } = renderUI(<FinancialPrivacyContext value={{ hidden: true, setHidden: vi.fn() }}><ExpenseGroupsView report={report()} mode={mode} /></FinancialPrivacyContext>);
    expect(container).not.toHaveTextContent(/R\$\s*\d|64,0%|36,0%|100,0%/);
    expect(screen.getAllByRole("img", { name: "Valor oculto" }).length).toBeGreaterThan(10);
    expect(container.querySelector(".recharts-surface")).toBeNull();
  });
  it("explains negative net groups without plotting misleading donut areas", () => {
    const data = report();
    data.totals = { ...data.totals, unclassifiedCents: -10000, totalCents: 490000 };
    renderUI(<ExpenseGroupsChart totals={data.totals} series={data.series} mode="monthly" />);
    expect(screen.getByText(/Há um grupo com créditos líquidos negativos/)).toBeVisible();
  });
  it("uses the plural recurring warning and formats chart tooltips", async () => {
    const data = report();
    data.recurringInVariableCount = 2;
    const view = renderUI(<ExpenseGroupsView report={data} mode="monthly" />);
    expect(screen.getByText(/2 gastos recorrentes estão em categorias variáveis/)).toBeVisible();
    const sector = view.container.querySelector(".recharts-pie-sector")!;
    fireEvent.mouseOver(sector);
    fireEvent.mouseMove(sector, { clientX: 160, clientY: 120 });
    expect(await screen.findByText(/Gastos fixos:.*3.200,00/)).toBeVisible();
  });
});
