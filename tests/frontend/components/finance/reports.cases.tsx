import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "@/app/(finance)/reports/page";
import { getReport } from "@/lib/server/reports";
import { buildReport } from "@/lib/report-aggregation";
import { ReportSummary } from "@/components/finance/reports/summary";
import { ReportTables } from "@/components/finance/reports/tables";
import { ReportEntries } from "@/components/finance/reports/entries";
import { ReportControls } from "@/components/finance/reports/controls";
import { renderUI } from "@/tests/frontend/helpers";

vi.mock("@/lib/server/reports", () => ({ getReport: vi.fn() }));
const empty = { activeTransactions: [], expenses: [], installments: [] };
const report = () => buildReport({ mode: "monthly", period: "2026-07" }, "2026-07-16", empty);

describe("reports interface", () => {
  it("loads URL filters after authentication and handles invalid filters explicitly", async () => {
    vi.mocked(getReport).mockResolvedValueOnce(report());
    renderUI(await Page({ searchParams: Promise.resolve({ mode: "monthly", period: "2026-07" }) }));
    expect(getReport).toHaveBeenCalledWith({ mode: "monthly", period: "2026-07" });
    expect(screen.getByRole("heading", { name: "Relatórios" })).toBeVisible();
    expect(screen.getByLabelText("Período", { exact: true })).toHaveValue("2026-07");
  });
  it("rejects malformed periods and propagates query failure without rendering zeros", async () => {
    renderUI(await Page({ searchParams: Promise.resolve({ period: "2026-13" }) }));
    expect(screen.getByRole("alert")).toHaveTextContent("Período inválido");
    vi.mocked(getReport).mockRejectedValueOnce(new Error("offline"));
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("offline");
  });
  it("explains partial periods, missing history, formulas and empty months", async () => {
    const { user } = renderUI(<><ReportSummary report={report()} /><ReportTables report={report()} /></>);
    expect(screen.getAllByText("Não aplicável").length).toBeGreaterThan(0);
    expect(screen.getByText(/Período parcial/)).toBeVisible();
    expect(screen.getByText(/Sem movimentações no período anterior/)).toBeVisible();
    await user.click(screen.getByText("Como calculamos"));
    expect(screen.getByText(/Transferências e valorização/)).toBeVisible();
    expect(screen.getAllByText("Sem registros")).toHaveLength(7);
  });
  it("renders nonzero metrics, positive and inapplicable comparisons and both record origins", () => {
    const data = report();
    data.totals.savingsRate = 40;
    data.comparison = { hasHistory: true, percentage: 20, differenceCents: 100 };
    data.partial = false;
    data.entries = [
      { id: "p", month: "2026-07", description: "Pending salary", amountCents: 100, type: "income", status: "pending", source: "transaction", category: "Salary", categoryId: "salary", account: "Main" },
      { id: "i", month: "2026-07", description: "Credit", amountCents: -100, type: "expense", status: "installment", source: "installment", category: "Archived", categoryId: "archived", account: "Card" },
      { id: "e", month: "2026-07", description: "Posted expense", amountCents: 100, type: "expense", status: "posted", source: "transaction", category: "Food", categoryId: "food", account: "Main" },
    ];
    data.categories = [{ id: "expense:archived", name: "Archived", type: "expense", amountCents: -100, previousCents: 0 }];
    data.series[0].metrics.savingsRate = 40;
    data.series[0].hasMovements = true;
    renderUI(<><ReportSummary report={data} /><ReportTables report={data} /><ReportEntries report={data} /></>);
    expect(screen.getByText("40%")).toBeVisible();
    expect(screen.getByText(/20.00%/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Parcela de cartão" })).toHaveAttribute("href", "/credit-card?month=2026-07");
    expect(screen.getByText("Pendente", { exact: true })).toBeVisible();
    expect(screen.getByText("Efetivado", { exact: true })).toBeVisible();
  });
  it("explains future annual periods and renders annual controls", () => {
    const future = buildReport({ mode: "annual", period: "2027" }, "2026-07-16", empty);
    future.comparison.hasHistory = true;
    renderUI(<><ReportSummary report={future} /><ReportTables report={future} /><ReportControls mode="annual" period="2027" previousPeriod="2026" nextPeriod="2028" /></>);
    expect(screen.getByText(/Período futuro:/)).toBeVisible();
    expect(screen.getByText(/percentual não aplicável/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Mensal" })).toHaveAttribute("href", "/reports?mode=monthly&period=2027-01");
  });
});
