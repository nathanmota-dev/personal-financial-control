import { act, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MonthlySummaryContent } from "@/components/finance/reports/monthly-summary-content";
import { ReportTables } from "@/components/finance/reports/tables";
import { buildReport } from "@/lib/report-aggregation";
import { buildMonthlyRetrospective } from "@/lib/monthly-retrospective";
import type { MonthlyRetrospective } from "@/lib/interfaces/monthly-retrospective";
import { renderUI } from "@/tests/frontend/helpers";

const empty = () => buildReport({ mode: "monthly", period: "2026-06" }, "2026-07-16", { activeTransactions: [], expenses: [], installments: [] });
function summary(): MonthlyRetrospective {
  const report = empty();
  report.comparison.hasHistory = true;
  report.categories = [{ id: "expense:food", name: "Alimentação", type: "expense", amountCents: 70000, previousCents: 50000 }];
  report.totals = { ...report.totals, incomeCents: 100000, expenseCents: 70000, operatingResultCents: 30000, netResultCents: 30000, savingsRate: 30 };
  report.entries = [{ id: "i", month: "2026-06", description: "Mercado no cartão", amountCents: 70000, type: "expense", source: "installment", status: "installment", category: "Alimentação", categoryId: "food", account: "Cartão" }];
  return buildMonthlyRetrospective(report, [{ ...report.entries[0], id: "previous", month: "2026-05", description: "Mercado anterior", amountCents: 50000, source: "transaction", status: "posted" }]);
}

describe("monthly summary interface", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn(async (url) => Response.json(String(url).includes("view=summary") ? { summary: summary() } : String(url).includes("categories") ? { categories: [] } : { entries: [] }))));
  it("fetches only on demand and keeps data across all view changes", async () => {
    const { user } = renderUI(<ReportTables report={{ ...empty(), entryCount: 0 }} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(await screen.findByText(/aumento de/)).toHaveTextContent(/200,00.*40%/);
    expect(fetch).toHaveBeenLastCalledWith("/api/reports?mode=monthly&period=2026-06&view=summary", expect.objectContaining({ cache: "no-store" }));
    await user.click(screen.getByRole("tab", { name: "Meses do ano" }));
    await user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(screen.getByText(/aumento de/)).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Categorias" }));
    await user.click(screen.getByRole("tab", { name: "Origens dos totais" }));
    await user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("shows values and both months' evidence with installment and transaction links", async () => {
    renderUI(<MonthlySummaryContent summary={summary()} />);
    expect(screen.getByText("30%", { exact: true })).toBeVisible();
    expect(screen.getByText(/parcela reconhecida no mês/)).toBeVisible();
    expect(screen.getByText(/maio de 2026:.*500,00.*junho de 2026:.*700,00/)).toBeVisible();
    const evidence = screen.getByRole("region", { name: "Despesas de Alimentação nos dois meses" });
    expect(within(evidence).getByText("Mercado anterior")).toBeVisible();
    expect(within(evidence).getByText("Mercado no cartão")).toBeVisible();
    expect(within(evidence).getByText(/maio de 2026/)).toBeVisible();
    expect(evidence.textContent).not.toMatch(/2026-0[56]/);
    expect(document.querySelector("details")).toBeNull();
    expect(within(evidence).getByRole("link", { name: "Lançamento" })).toHaveAttribute("href", "/transactions?month=2026-05");
    expect(screen.getAllByRole("link", { name: "Parcela de cartão" })[0]).toHaveAttribute("href", "/credit-card?month=2026-06");
  });
  it.each(["partial", "future", "empty", "credits", "no-history", "no-change"])("explains %s without invalid percentages or negative biggest spending", (state) => {
    const data = summary();
    data.insights = [];
    if (state === "partial") data.partial = true;
    if (state === "future") data.future = true;
    if (state === "no-history") data.hasHistory = false;
    if (state === "empty" || state === "credits") {
      data.largestExpense = null; data.largestCategory = null; data.totals.savingsRate = null;
      data.entries = state === "empty" ? [] : [{ ...data.entries[0], amountCents: -70000 }];
    }
    renderUI(<MonthlySummaryContent summary={data} />);
    expect(screen.queryByText(/aumento de/)).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    if (state === "partial" || state === "future") expect(screen.getByText(/Comparação conclusiva disponível/)).toBeVisible();
    if (state === "empty" || state === "credits") expect(screen.getByText("Sem despesa positiva registrada.")).toBeVisible();
    if (state === "no-history") expect(screen.getByText(/Sem registros no mês anterior/)).toBeVisible();
    if (state === "no-change") expect(screen.getByText(/Nenhuma mudança por categoria/)).toBeVisible();
  });
  it("describes new spending and negative bases without percentages", () => {
    const data = summary();
    data.insights = [{ ...data.insights[0], kind: "new", percentage: null, previousCents: 0 }, { ...data.insights[0], id: "expense:other", category: "Outros", kind: "absolute", percentage: null, previousCents: -10000 }];
    renderUI(<MonthlySummaryContent summary={data} />);
    expect(screen.getByText(/novo gasto no período/)).toBeVisible();
    expect(screen.getByText(/base anterior sem percentual/)).toBeVisible();
  });
  it("describes reductions and an empty category source list", async () => {
    const data = summary();
    data.insights = [{ ...data.insights[0], kind: "decrease", percentage: -40, differenceCents: -20000, currentCents: 30000 }];
    data.entries = []; data.previousEntries = [];
    renderUI(<MonthlySummaryContent summary={data} />);
    expect(screen.getByText(/redução de/)).toHaveTextContent(/200,00.*40%/);
    expect(screen.getByText(/Sem registros de despesa nesta categoria/)).toBeVisible();
  });
  it.each(["http", "network", "missing"])("reports %s failure without zero insights and permits retry", async (failure) => {
    let fail = true;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (!url.includes("view=summary")) return Response.json(url.includes("view=categories") ? { categories: [] } : { entries: [] });
      if (!fail) return Response.json({ summary: summary() });
      if (failure === "network") throw new Error("offline");
      return failure === "http" ? new Response(null, { status: 500 }) : Response.json({});
    });
    const { user } = renderUI(<ReportTables report={{ ...empty(), entryCount: 0 }} />);
    await user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
    expect(screen.queryByText("Não aplicável")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Meses do ano" }));
    await user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(fetch).toHaveBeenCalledTimes(3);
    fail = false;
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText(/aumento de/)).toBeVisible();
  });
  it("aborts replaced periods and ignores late responses", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("period=2026-05&view=summary")) return new Promise((resolve) => { finish = resolve; });
      return Response.json(url.includes("view=summary") ? { summary: summary() } : url.includes("view=categories") ? { categories: [] } : { entries: [] });
    });
    const view = renderUI(<ReportTables report={{ ...empty(), period: "2026-05", entryCount: 0 }} />);
    await view.user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    const signal = vi.mocked(fetch).mock.calls.find(([input]) => String(input).includes("period=2026-05&view=summary"))![1]?.signal;
    view.rerender(<ReportTables report={{ ...empty(), entryCount: 0 }} />);
    expect(signal?.aborted).toBe(true);
    expect(await screen.findByText(/aumento de/)).toBeVisible();
    await act(async () => finish(Response.json({ summary: { ...summary(), period: "2026-05" } })));
    expect(screen.getByText(/aumento de/)).toBeVisible();
  });
  it("continues an unfinished request across view changes without requesting again", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(async (input) => String(input).includes("view=summary") ? new Promise((resolve) => { finish = resolve; }) : Response.json(String(input).includes("categories") ? { categories: [] } : { entries: [] }));
    const { user } = renderUI(<ReportTables report={{ ...empty(), entryCount: 0 }} />);
    await user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    const signal = vi.mocked(fetch).mock.calls[2][1]?.signal;
    await user.click(screen.getByRole("tab", { name: "Meses do ano" }));
    await user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(signal?.aborted).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(3);
    await act(async () => finish(Response.json({ summary: summary() })));
    expect(screen.getByText(/aumento de/)).toBeVisible();
  });
  it("requests fresh data after the report route is remounted", async () => {
    const view = renderUI(<ReportTables report={{ ...empty(), entryCount: 0 }} />);
    await view.user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(await screen.findByText(/aumento de/)).toBeVisible();
    view.unmount();
    const next = renderUI(<ReportTables report={{ ...empty(), entryCount: 0 }} />);
    await next.user.click(screen.getByRole("tab", { name: "Resumo do mês" }));
    expect(await screen.findByText(/aumento de/)).toBeVisible();
    expect(vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes("view=summary"))).toHaveLength(2);
  });
  it("does not offer a monthly summary for annual reports", () => {
    renderUI(<ReportTables report={{ ...empty(), mode: "annual", period: "2026", entryCount: 0 }} />);
    expect(screen.queryByRole("tab", { name: "Resumo do mês" })).not.toBeInTheDocument();
  });
});
