import { expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import * as route from "@/app/api/reports/export/route";
import { getFinanceDatabase } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { createCategory, archiveCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { getReport, getReportInitial, getReportView } from "@/lib/server/reports";
import { parseReportCsv, csvCents } from "@/tests/helpers/report-csv";

const state = routeDatabase();
guardCases(route);

it.each(["summary", "categories"])("returns a private CSV attachment: %s", async (kind) => {
  const response = await route.GET(request("GET", undefined, `?mode=monthly&period=2026-07&kind=${kind}`));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
  expect(response.headers.get("Content-Disposition")).toBe(`attachment; filename="relatorio-${kind === "summary" ? "resumo" : "categorias"}-mensal-2026-07.csv"`);
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect([...new Uint8Array(await response.arrayBuffer()).slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
});

it.each(["?mode=invalid&kind=summary", "?period=2026-13&kind=categories", "?kind=invalid", "?mode=annual&period=0001&kind=summary", ""])("rejects invalid exports before reading data: %s", async (query) => {
  const response = await route.GET(request("GET", undefined, query));
  expect(response.status).toBe(400);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(getFinanceDatabase).not.toHaveBeenCalled();
});

it("fails without a partial CSV or private database details", async () => {
  vi.mocked(getFinanceDatabase).mockRejectedValueOnce(new Error("private database details"));
  const response = await route.GET(request("GET", undefined, "?kind=summary"));
  expect(response.status).toBe(500);
  expect(response.headers.get("Content-Disposition")).toBeNull();
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(await response.json()).toEqual({ error: "Não foi possível gerar a exportação. Tente novamente." });
});

it("reconciles monthly and annual CSVs with the displayed data, including pending, archived, uncategorized and credit entries", async () => {
  const db = await getFinanceDatabase();
  const category = await createCategory({ name: 'Histórico; "comida"\nCasa', group: "variable_expense" }, db);
  const refund = await createCategory({ name: "=1+1", group: "variable_expense" }, db);
  const common = { accountId: state.checkingId, competenceMonth: "2026-01", transactionDate: "2026-01-10", status: "posted" as const };
  await db.insert(transactions).values([
    { ...common, type: "income", amountCents: 500001, description: "Salary" },
    { ...common, type: "investment_contribution", amountCents: 100001, description: "Invest" },
    { ...common, type: "investment_withdrawal", amountCents: 20000, description: "Withdraw" },
    { ...common, type: "expense", categoryId: category.id, amountCents: 300001, status: "pending", description: "Pending" },
    { ...common, type: "expense", amountCents: 5001, description: "Uncategorized" },
    { ...common, type: "expense", amountCents: 999999, status: "cancelled", description: "Cancelled" },
    { ...common, competenceMonth: "2026-02", type: "income", amountCents: 100001, description: "February" },
    { ...common, competenceMonth: "2025-12", type: "expense", categoryId: refund.id, amountCents: 888888, description: "Previous only" },
  ]);
  await createCreditCardCharge({ accountId: state.creditId, categoryId: category.id, description: "Installments", totalAmountCents: 60001, installmentCount: 3, purchaseDate: "2025-12-01", firstInvoiceMonth: "2026-01" }, db);
  await createCreditCardCharge({ accountId: state.creditId, categoryId: refund.id, description: "Refund", totalAmountCents: -3001, kind: "adjustment", installmentCount: 1, purchaseDate: "2026-01-02" }, db);
  await upsertCreditCardBill({ accountId: state.creditId, invoiceMonth: "2026-01", dueDate: "2026-01-12", statementTotalCents: 17000, currentChargesTotalCents: 17000 }, db);
  await createCreditCardBillPayment({ accountId: state.creditId, invoiceMonth: "2026-01", paymentAccountId: state.checkingId, amountCents: 10000, paymentDate: "2026-01-10", idempotencyKey: "csv-bill", description: "Payment" }, db);
  await archiveCategory(category.id, db);

  for (const selection of [{ mode: "monthly", period: "2026-01" }, { mode: "annual", period: "2026" }] as const) {
    const report = await getReport(selection, db);
    const initial = await getReportInitial(selection, db);
    const view = await getReportView(selection, "categories", db) as { categories: typeof report.categories };
    const query = new URLSearchParams(selection);
    const summary = parseReportCsv(await (await route.GET(request("GET", undefined, `?${query}&kind=summary`))).text());
    const categories = parseReportCsv(await (await route.GET(request("GET", undefined, `?${query}&kind=categories`))).text());
    const totals = summary.at(-1)!;
    expect(totals.slice(1, 8).map(csvCents)).toEqual([report.totals.incomeCents, report.totals.expenseCents, report.totals.operatingResultCents, report.totals.investmentContributionCents, report.totals.investmentWithdrawalCents, report.totals.netInvestmentFlowCents, report.totals.netResultCents]);
    expect(totals[8]).toBe(report.totals.savingsRate!.toFixed(2).replace(".", ","));
    if (selection.mode === "annual") {
      expect(summary.slice(1, -1).map((row) => row[0])).toEqual(initial.series.map((row) => row.month));
      for (const [index, month] of initial.series.entries()) expect(csvCents(summary[index + 1][2])).toBe(month.metrics.expenseCents);
    } else expect(csvCents(totals[2])).toBe(initial.series.find((row) => row.month === selection.period)!.metrics.expenseCents);
    for (const item of view.categories.filter((row) => row.type === "expense")) {
      expect(categories.slice(1).filter((row) => row[1] === item.id).reduce((sum, row) => sum + csvCents(row[3]), 0)).toBe(item.amountCents);
    }
    expect(categories.slice(1).reduce((sum, row) => sum + csvCents(row[3]), 0)).toBe(report.totals.expenseCents);
    expect(categories.slice(1).some((row) => row[1] === "expense:uncategorized" && row[2] === "Sem categoria")).toBe(true);
    expect(categories.slice(1).some((row) => row[2] === category.name)).toBe(true);
    expect(categories.slice(1).find((row) => row[1] === `expense:${refund.id}`)?.slice(2)).toEqual(["'=1+1", "-30,01"]);
  }
});
