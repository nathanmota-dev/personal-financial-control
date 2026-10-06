import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/reports/page";
import { getReportInitial } from "@/lib/server/reports";
import { buildReport } from "@/lib/report-aggregation";
import { ReportNotes } from "@/components/finance/reports/notes";
import { navigation } from "@/tests/frontend/setup";
import { ReportTables } from "@/components/finance/reports/tables";
import { ReportControls } from "@/components/finance/reports/controls";
import { renderUI } from "@/tests/frontend/helpers";

vi.mock("@/lib/server/reports", () => ({ getReportInitial: vi.fn() }));
const empty = { activeTransactions: [], expenses: [], installments: [] };
const report = () => ({ ...buildReport({ mode: "monthly", period: "2026-07" }, "2026-07-16", empty), entryCount: 0 });

describe("reports interface", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => Response.json(url.includes("view=categories") ? { categories: [] } : { entries: [] })));
  });
  it("loads URL filters after authentication and handles invalid filters explicitly", async () => {
    vi.mocked(getReportInitial).mockResolvedValueOnce(report());
    renderUI(await Page({ searchParams: Promise.resolve({ mode: "monthly", period: "2026-07" }) }));
    expect(getReportInitial).toHaveBeenCalledWith({ mode: "monthly", period: "2026-07" });
    expect(screen.getByRole("heading", { name: "Relatórios" })).toBeVisible();
    expect(screen.getByRole("button", { name: "julho de 2026" })).toBeVisible();
  });
  it("rejects malformed periods and propagates query failure without rendering zeros", async () => {
    renderUI(await Page({ searchParams: Promise.resolve({ period: "2026-13" }) }));
    expect(screen.getByRole("alert")).toHaveTextContent("Período inválido");
    vi.mocked(getReportInitial).mockRejectedValueOnce(new Error("offline"));
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("offline");
  });
  it("keeps the reading guide and displays only the selected table view", async () => {
    const { user } = renderUI(<><ReportNotes report={report()} /><ReportTables report={report()} /></>);
    expect(screen.getByRole("heading", { name: "Leitura do relatório" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Meses do ano" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Origens dos totais" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Sem registros")).toHaveLength(7);
    expect(document.querySelector("details")).toBeNull();
    expect(screen.getByText(/Transferências e valorização/)).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Categorias" }));
    expect(await screen.findByRole("heading", { name: "Categorias e comparação" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Meses do ano" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Origens dos totais" }));
    expect(await screen.findByRole("heading", { name: "Origens dos totais" })).toBeVisible();
    expect(screen.queryByRole("article", { name: "Receitas" })).not.toBeInTheDocument();
  });
  it("renders both record origins and category comparisons in their views", async () => {
    const data = report();
    data.entries = [
      { id: "p", month: "2026-07", description: "Pending salary", amountCents: 100, type: "income", status: "pending", source: "transaction", category: "Salary", categoryId: "salary", account: "Main" },
      { id: "i", month: "2026-07", description: "Credit", amountCents: -100, type: "expense", status: "installment", source: "installment", category: "Archived", categoryId: "archived", account: "Card" },
      { id: "e", month: "2026-07", description: "Posted expense", amountCents: 100, type: "expense", status: "posted", source: "transaction", category: "Food", categoryId: "food", account: "Main" },
    ];
    data.categories = [{ id: "expense:archived", name: "Archived", type: "expense", amountCents: -100, previousCents: 0 }];
    vi.mocked(fetch).mockImplementation(async (input) => Response.json(String(input).includes("view=categories") ? { categories: data.categories } : { entries: data.entries }));
    const { user } = renderUI(<ReportTables report={data} />);
    await user.click(screen.getByRole("tab", { name: "Categorias" }));
    expect(await screen.findByText("Archived")).toBeVisible();
    expect(screen.getByText(/Comparação com junho de 2026/)).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Origens dos totais" }));
    expect(screen.getAllByRole("link", { name: "Parcela de cartão" })[0]).toHaveAttribute("href", "/credit-card?month=2026-07");
    expect(screen.getAllByText("Pendente", { exact: true })[0]).toBeVisible();
    expect(screen.queryByText("2026-07", { exact: true })).not.toBeInTheDocument();
    expect(screen.getAllByText("Efetivado", { exact: true })[0]).toBeVisible();
  });
  it("selects a month with the shared picker and switches mode through the URL", async () => {
    const { user } = renderUI(<ReportControls mode="monthly" period="2026-07" defaultMonth="2026-07" />);
    await user.click(screen.getByRole("button", { name: "julho de 2026" }));
    await user.click(screen.getByRole("button", { name: "Jun" }));
    expect(navigation.push).toHaveBeenCalledWith("/reports?mode=monthly&period=2026-06");
    await user.click(screen.getByRole("tab", { name: "Anual" }));
    expect(navigation.push).toHaveBeenCalledWith("/reports?mode=annual&period=2026&month=2026-07");
  });
  it("uses the shared period controls and preserves browser history through URL navigation", async () => {
    const { user } = renderUI(<ReportControls mode="annual" period="2027" defaultMonth="2026-10" />);
    await user.click(screen.getByRole("button", { name: "Selecionar ano: 2027" }));
    const input = screen.getByRole("spinbutton", { name: "Ano do relatório" });
    await user.clear(input);
    await user.type(input, "2025");
    await user.click(screen.getByRole("button", { name: "Consultar ano" }));
    expect(navigation.push).toHaveBeenCalledWith("/reports?mode=annual&period=2025&month=2026-10");
    await user.click(screen.getByRole("tab", { name: "Mensal" }));
    expect(navigation.push).toHaveBeenCalledWith("/reports?mode=monthly&period=2026-10");
    expect(screen.queryByRole("link", { name: "Período anterior" })).not.toBeInTheDocument();
  });
  it("restores the remembered monthly selection after changing the annual year", async () => {
    const { user } = renderUI(<ReportControls mode="annual" period="2027" defaultMonth="2026-10" rememberedMonth="2026-08" />);
    await user.click(screen.getByRole("tab", { name: "Mensal" }));
    expect(navigation.push).toHaveBeenCalledWith("/reports?mode=monthly&period=2026-08");
  });
  it("renders months first and loads sources while categories are still pending", async () => {
    let resolveCategories!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { resolveCategories = resolve; }));
    const { user } = renderUI(<ReportTables report={report()} />);
    expect(screen.getByRole("heading", { name: "Meses do ano" })).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, "/api/reports?mode=monthly&period=2026-07&view=categories", expect.anything());
    await user.click(screen.getByRole("tab", { name: "Origens dos totais" }));
    expect(await screen.findByRole("heading", { name: "Origens dos totais" })).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Categorias" }));
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    await act(async () => resolveCategories(Response.json({ categories: [] })));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/reports?mode=monthly&period=2026-07&view=sources", expect.anything());
    expect(await screen.findByRole("heading", { name: "Categorias e comparação" })).toBeVisible();
  });
  it("shows request failures without losing months and allows retry", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { user } = renderUI(<ReportTables report={report()} />);
    await user.click(screen.getByRole("tab", { name: "Categorias" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Categorias e comparação" })).toBeVisible();
  });
});
