import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderUI } from "@/tests/frontend/helpers";
import { aggregateBudgets } from "@/lib/budget-aggregation";
import { BudgetsView } from "@/components/finance/budgets/budgets-view";
import { BudgetForm } from "@/components/finance/budgets/budget-form";
import { BudgetCopy } from "@/components/finance/budgets/budget-copy";
import { BudgetRemove } from "@/components/finance/budgets/budget-remove";
import * as actions from "@/app/actions/finance/budgets";
import type { BudgetOverview } from "@/lib/interfaces/budgets";
import Page from "@/app/(finance)/budgets/page";
import Loading from "@/app/(finance)/budgets/loading";
import { getBudgetOverview } from "@/lib/server/budgets";
vi.mock("@/app/actions/finance/budgets", () => ({ saveBudgetAction: vi.fn(), copyPreviousBudgetsAction: vi.fn(), removeBudgetAction: vi.fn() }));
vi.mock("@/lib/server/budgets", () => ({ getBudgetOverview: vi.fn() }));
const category = { id: "00000000-0000-4000-8000-000000000001", name: "Food", group: "variable_expense", isArchived: false };
const limit = { id: "limit", categoryId: category.id, competenceMonth: "2026-07", amountCents: 80000 };
const expense = { id: "expense", categoryId: category.id, categoryName: category.name, accountName: "Card", amountCents: 45000, pending: false, date: "2026-07-01", description: "Purchase", origin: "Parcela / ajuste de cartão" };
const empty: BudgetOverview = { month: "2026-07", categories: [category], rows: [], committedCents: 0 };
beforeEach(() => {
  vi.mocked(actions.saveBudgetAction).mockReset().mockResolvedValue({ ok: true, data: null });
  vi.mocked(actions.removeBudgetAction).mockReset().mockResolvedValue({ ok: true, data: null });
  vi.mocked(actions.copyPreviousBudgetsAction).mockReset().mockResolvedValue({ ok: true, data: 1 });
  vi.mocked(getBudgetOverview).mockReset().mockResolvedValue(empty);
});
it("renders authorized monthly budgets, empty and loading states and propagates read errors", async () => {
  const view = renderUI(await Page({ searchParams: Promise.resolve({ month: "2026-07" }) }));
  expect(screen.getByRole("heading", { name: "Orçamentos" })).toBeVisible();
  expect(screen.getByText(/Nenhum limite ou despesa/)).toBeVisible();
  expect(getBudgetOverview).toHaveBeenCalledWith("2026-07");
  view.unmount(); renderUI(<Loading />);
  expect(screen.getByRole("status")).toHaveTextContent("Carregando orçamentos");
  await Page({ searchParams: Promise.resolve({ month: ["bad"] }) });
  expect(getBudgetOverview).toHaveBeenCalledWith("2026-07");
  vi.mocked(getBudgetOverview).mockRejectedValueOnce(new Error("database unavailable"));
  await expect(Page({ searchParams: Promise.resolve({ month: "2026-07" }) })).rejects.toThrow("database unavailable");
});
it.each([45000, 64000, 80000, -5000])("renders accessible consumption and expense origins for %s cents", async (amountCents) => {
  const rows = aggregateBudgets([{ ...category, isArchived: true }], [limit], [
    { ...expense, amountCents },
    { ...expense, id: "pending", categoryId: "other", categoryName: "Other", pending: true },
    { ...expense, id: "unknown", categoryId: null, categoryName: "Sem categoria" },
  ]);
  renderUI(<BudgetsView overview={{ ...empty, categories: [], rows, committedCents: rows.reduce((sum, row) => sum + row.committedCents, 0) }} />);
  expect(screen.getByRole("heading", { name: "Despesas sem limite" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Despesas sem categoria" })).toBeVisible();
  expect(screen.getByText("Arquivada")).toBeVisible();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", String(Math.max(0, Math.min(100, amountCents / 80000 * 100))));
  fireEvent.click(screen.getByText("Conferir despesas de Food (1)"));
  expect(screen.getAllByText(/Card · Parcela/).length).toBe(3);
  if (amountCents < 0) expect(screen.getAllByText(/crédito/i).length).toBeGreaterThan(0);
});
it("creates and edits limits and shows validation and network errors", async () => {
  const { user, unmount } = renderUI(<BudgetForm month="2026-07" categories={[category]} />);
  await user.selectOptions(screen.getByRole("combobox"), category.id);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "800,00" } });
  await user.click(screen.getByRole("button", { name: "Criar limite" }));
  await waitFor(() => expect(actions.saveBudgetAction).toHaveBeenCalledWith({ categoryId: category.id, competenceMonth: "2026-07", amountCents: 80000 }));
  expect(screen.getByRole("status")).toHaveTextContent("Limite salvo");
  vi.mocked(actions.saveBudgetAction).mockResolvedValueOnce({ ok: false, error: { code: "INVALID_AMOUNT", message: "Valor inválido" } });
  await user.click(screen.getByRole("button", { name: "Criar limite" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Valor inválido"));
  vi.mocked(actions.saveBudgetAction).mockRejectedValueOnce(new Error("network"));
  await user.click(screen.getByRole("button", { name: "Criar limite" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Não foi possível salvar"));
  unmount(); renderUI(<BudgetForm month="2026-07" categories={[category]} limit={limit} />);
  await user.click(screen.getByRole("button", { name: "Salvar limite" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Limite salvo"));
});
it("copies and removes limits, reporting operation and transport failures", async () => {
  const { user, unmount } = renderUI(<BudgetCopy month="2026-07" />);
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 limite(s) copiado(s)"));
  vi.mocked(actions.copyPreviousBudgetsAction).mockResolvedValueOnce({ ok: false, error: { code: "FAIL", message: "Falha na cópia" } });
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Falha na cópia"));
  vi.mocked(actions.copyPreviousBudgetsAction).mockRejectedValueOnce(new Error("network"));
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Não foi possível copiar"));
  unmount(); renderUI(<BudgetRemove categoryId={category.id} competenceMonth="2026-07" />);
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Limite removido"));
  vi.mocked(actions.removeBudgetAction).mockResolvedValueOnce({ ok: false, error: { code: "FAIL", message: "Falha na remoção" } });
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Falha na remoção"));
  vi.mocked(actions.removeBudgetAction).mockRejectedValueOnce(new Error("network"));
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Não foi possível remover"));
});
it("offers expense details for a limit with no movements", () => {
  renderUI(<BudgetsView overview={{ ...empty, rows: aggregateBudgets([category], [limit], []) }} />);
  expect(screen.getByText("Nenhuma despesa nesta competência.")).toBeInTheDocument();
});
