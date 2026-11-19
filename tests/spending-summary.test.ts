import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardCharge } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { getOrCreatePendingCategory } from "@/lib/server/pending-category";
import { getReport } from "@/lib/server/reports";
import { getSpendingSummary, SPENDING_MAX_ENTRIES } from "@/lib/server/spending-summary";
import { createTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

let database: Database;
let checking: string;
let card: string;
let salary: string;
let rent: string;
let market: string;

const db = () => database.db;
const entry = (description: string, amountCents: number, overrides: Record<string, unknown> = {}) => createTransaction({
  accountId: checking, type: "expense", status: "posted", amountCents, transactionDate: "2026-03-10",
  competenceMonth: "2026-03", description, ...overrides,
}, db());

beforeEach(async () => {
  database = await createTestDatabase();
  checking = (await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 0 }, db())).id;
  card = (await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 25, creditDueDay: 5 }, db())).id;
  salary = (await createCategory({ name: "Salário", group: "income" }, db())).id;
  rent = (await createCategory({ name: "Aluguel", group: "fixed_expense" }, db())).id;
  market = (await createCategory({ name: "Mercado", group: "variable_expense" }, db())).id;
});

afterEach(async () => {
  await database.cleanup();
});

async function seedMarch() {
  await entry("Salário março", 500000, { type: "income", categoryId: salary });
  await entry("Aluguel", 150000, { categoryId: rent });
  await entry("Supermercado Pão de Açúcar", 32000, { categoryId: market });
  await entry("Feira", 8000, { categoryId: market, status: "pending" });
  await entry("Sem categoria", 1500);
  await entry("Cancelado", 99999, { categoryId: market, status: "cancelled" });
  await createCreditCardCharge({ accountId: card, categoryId: market, description: "Atacadão", purchaseDate: "2026-02-20", totalAmountCents: 20000, installmentCount: 2, firstInvoiceMonth: "2026-03" }, db());
  await createCreditCardCharge({ accountId: card, categoryId: (await getOrCreatePendingCategory(db())).id, description: "Loja X", purchaseDate: "2026-02-21", totalAmountCents: 4000, installmentCount: 1, firstInvoiceMonth: "2026-03" }, db());
  await upsertCreditCardBill({ accountId: card, invoiceMonth: "2026-03", dueDate: "2026-04-05", statementTotalCents: 14000, currentChargesTotalCents: 14000 }, db());
  await createCreditCardBillPayment({ accountId: card, invoiceMonth: "2026-03", paymentAccountId: checking, amountCents: 14000, paymentDate: "2026-04-05", idempotencyKey: "bill:2026-03" }, db());
}

describe("spending summary", () => {
  it("matches the reports page totals for the month", async () => {
    await seedMarch();
    const summary = await getSpendingSummary({ fromMonth: "2026-03" }, db());
    const report = await getReport({ mode: "monthly", period: "2026-03" }, db(), "2026-12-31");

    expect(summary.totals).toMatchObject({
      incomeCents: report.totals.incomeCents,
      expenseCents: report.totals.expenseCents,
      fixedExpenseCents: report.totals.fixedExpenseCents,
      variableExpenseCents: report.totals.variableExpenseCents,
      uncategorizedExpenseCents: report.totals.uncategorizedExpenseCents,
    });
    expect(summary.totals).toMatchObject({ incomeCents: 500000, expenseCents: 150000 + 32000 + 8000 + 1500 + 10000 + 4000, uncategorizedExpenseCents: 5500 });
  });

  it("answers how much was spent on one category, with the entries behind it", async () => {
    await seedMarch();
    const summary = await getSpendingSummary({ fromMonth: "2026-03", toMonth: "2026-04", type: "expense", categoryIds: [market], includeEntries: true }, db());

    expect(summary.totals.expenseCents).toBe(32000 + 8000 + 10000 + 10000);
    expect(summary.byMonth).toEqual([
      { month: "2026-03", incomeCents: 0, expenseCents: 50000 },
      { month: "2026-04", incomeCents: 0, expenseCents: 10000 },
    ]);
    expect(summary.byCategory).toEqual([{ categoryId: market, categoryName: "Mercado", categoryGroup: "variable_expense", type: "expense", amountCents: 60000, entryCount: 4 }]);
    expect(summary.entries?.map((row) => row.description)).toEqual(["Supermercado Pão de Açúcar", "Atacadão", "Atacadão", "Feira"]);
    expect(summary.entries?.filter((row) => row.source === "card_installment").map((row) => row.month)).toEqual(["2026-03", "2026-04"]);
    expect(summary.entriesTruncated).toBe(false);
  });

  it("filters by description text, account and uncategorized", async () => {
    await seedMarch();
    expect((await getSpendingSummary({ fromMonth: "2026-03", search: "pao de acucar" }, db())).totals.expenseCents).toBe(32000);
    expect((await getSpendingSummary({ fromMonth: "2026-03", accountId: card }, db())).totals.expenseCents).toBe(14000);
    const uncategorized = await getSpendingSummary({ fromMonth: "2026-03", uncategorized: true }, db());
    expect(uncategorized.byCategory.map((row) => row.categoryName).sort()).toEqual(["A classificar", "Sem categoria"]);
    expect(uncategorized.totals.entryCount).toBe(2);
  });

  it("caps the returned entries and rejects inverted or oversized periods", async () => {
    for (let index = 0; index <= SPENDING_MAX_ENTRIES; index += 1) await entry(`Compra ${index}`, 100 + index, { categoryId: market });
    const summary = await getSpendingSummary({ fromMonth: "2026-03", includeEntries: true }, db());
    expect(summary.entries).toHaveLength(SPENDING_MAX_ENTRIES);
    expect(summary.entries?.[0].amountCents).toBe(100 + SPENDING_MAX_ENTRIES);
    expect(summary.entriesTruncated).toBe(true);

    await expect(getSpendingSummary({ fromMonth: "2026-04", toMonth: "2026-03" }, db())).rejects.toMatchObject({ code: "INVALID_PERIOD" });
    await expect(getSpendingSummary({ fromMonth: "2020-01", toMonth: "2026-01" }, db())).rejects.toMatchObject({ code: "INVALID_PERIOD" });
  });
});
