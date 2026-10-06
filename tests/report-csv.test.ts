import { describe, expect, it } from "vitest";
import { buildReport } from "@/lib/report-aggregation";
import { buildReportCsv } from "@/lib/report-csv";
import { reportCsvFilename } from "@/lib/report-periods";
import { parseReportCsv } from "@/tests/helpers/report-csv";

const empty = { activeTransactions: [], expenses: [], installments: [] };
const monthly = () => buildReport({ mode: "monthly", period: "2026-07" }, "2026-07-16", empty);

describe("pt-BR report CSV", () => {
  it("preserves accents, BOM, empty months and unavailable rates", () => {
    const csv = buildReportCsv(monthly(), "summary");
    expect([...Buffer.from(csv).subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const rows = parseReportCsv(csv);
    expect(rows[0]).toEqual(["Competência", "Receitas", "Despesas", "Resultado antes dos investimentos", "Aportes", "Resgates", "Investimentos líquidos", "Saldo livre", "Taxa de economia (%)"]);
    expect(rows[1]).toEqual(["2026-07", "0,00", "0,00", "0,00", "0,00", "0,00", "0,00", "0,00", ""]);
    expect(rows).toHaveLength(2);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(parseReportCsv(buildReportCsv(monthly(), "categories"))).toEqual([["Competência", "Identificador da categoria", "Categoria", "Despesa líquida"]]);
  });

  it("formats cent values, negative balances, investment flows and percentage points as numbers", () => {
    const report = monthly();
    report.totals = { ...report.totals, incomeCents: 500001, expenseCents: 300001, operatingResultCents: 200000, investmentContributionCents: 240001, investmentWithdrawalCents: 20000, netInvestmentFlowCents: 220001, netResultCents: -20001, savingsRate: 39.99992 };
    expect(parseReportCsv(buildReportCsv(report, "summary"))[1]).toEqual(["2026-07", "5000,01", "3000,01", "2000,00", "2400,01", "200,00", "2200,01", "-200,01", "40,00"]);
    report.totals.netInvestmentFlowCents = -123;
    expect(parseReportCsv(buildReportCsv(report, "summary"))[1][6]).toBe("-1,23");
  });

  it("exports only displayed months in a partial year, with a separately identified total", () => {
    const report = buildReport({ mode: "annual", period: "2026" }, "2026-03-10", empty);
    const rows = parseReportCsv(buildReportCsv(report, "summary"));
    expect(rows.slice(1).map((row) => row[0])).toEqual(["2026-01", "2026-02", "2026-03", "TOTAL"]);
    const future = buildReport({ mode: "annual", period: "2027" }, "2026-03-10", empty);
    expect(parseReportCsv(buildReportCsv(future, "summary")).slice(1)).toEqual([["TOTAL", "0,00", "0,00", "0,00", "0,00", "0,00", "0,00", "0,00", ""]]);
    expect(parseReportCsv(buildReportCsv(future, "categories"))).toHaveLength(1);
    const past = buildReport({ mode: "annual", period: "2025" }, "2026-03-10", empty);
    expect(parseReportCsv(buildReportCsv(past, "summary"))).toHaveLength(14);
  });

  it.each(['Alimentação; "casa"\nOutros', 'Nome\r\ncom CRLF', 'Acentos e aspas ""'])('escapes category text without changing its logical cell: %j', (name) => {
    const report = monthly();
    report.entries = [{ id: "1", month: "2026-07", categoryId: "archived", category: name, type: "expense", amountCents: -12345, source: "installment", status: "installment", description: "Credit", account: "Card" }];
    const rows = parseReportCsv(buildReportCsv(report, "categories"));
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(["2026-07", "expense:archived", name, "-123,45"]);
  });

  it.each(["=1+1", "+SUM(1)", "-1+2", "@SUM(1)", "   =1", "\t+1", "\r\n-1", "\u0000@1", "\u001f =1", "\u200b=1", "\uFEFF=1"])("neutralizes formula text %j while retaining numeric refunds", (name) => {
    const report = monthly();
    report.entries = [{ id: "1", month: "2026-07", categoryId: "1", category: name, type: "expense", amountCents: -123, source: "transaction", status: "posted", description: "Refund", account: "Main" }];
    expect(parseReportCsv(buildReportCsv(report, "categories"))[1]).toEqual(["2026-07", "expense:1", `'${name}`, "-1,23"]);
  });

  it.each([
    [{ kind: "summary", mode: "monthly", period: "2026-07" }, "relatorio-resumo-mensal-2026-07.csv"],
    [{ kind: "categories", mode: "annual", period: "2026" }, "relatorio-categorias-anual-2026.csv"],
  ] as const)("identifies the content and selected period in filenames", (selection, filename) => {
    expect(reportCsvFilename(selection)).toBe(filename);
  });
});
