import { afterEach, expect, it } from "vitest";
import { createTestDatabase } from "@/tests/helpers/database";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createTransaction, updateTransaction } from "@/lib/server/transactions";
import { createCreditCardCharge, updateCreditCardCharge, deleteCreditCardCharge } from "@/lib/server/credit-card";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { getReport, getReportView } from "@/lib/server/reports";
import type { MonthlyRetrospective } from "@/lib/interfaces/monthly-retrospective";

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { await Promise.all(cleanups.splice(0).map((cleanup) => cleanup())); });

it("rereads edits, cancellation and categorization with the same formulas as the report", async () => {
  const { db, cleanup } = await createTestDatabase(); cleanups.push(cleanup);
  const account = await createAccount({ name: "Conta", type: "checking", initialBalanceCents: 0 }, db);
  const food = await createCategory({ name: "Alimentação", group: "variable_expense" }, db);
  const other = await createCategory({ name: "Outros", group: "variable_expense" }, db);
  const base = { accountId: account.id, categoryId: food.id, type: "expense" as const, status: "posted" as const, description: "Mercado" };
  await createTransaction({ ...base, amountCents: 50000, competenceMonth: "2026-05", transactionDate: "2026-05-05" }, db);
  const current = await createTransaction({ ...base, amountCents: 70000, competenceMonth: "2026-06", transactionDate: "2026-06-05", status: "pending" }, db);
  const selection = { mode: "monthly" as const, period: "2026-06" };
  const load = async () => (await getReportView(selection, "summary", db, "2026-07-16") as { summary: MonthlyRetrospective }).summary;
  const first = await load();
  expect(first.insights[0]).toMatchObject({ differenceCents: 20000, percentage: 40 });
  expect(first.entries[0].id).toBe(current.id);
  expect(first.previousEntries[0].amountCents).toBe(50000);
  expect(first.pending).toEqual({ count: 1, amountCents: 70000 });
  await updateTransaction({ id: current.id, amountCents: 80000, categoryId: other.id }, db);
  const edited = await load();
  expect(edited.totals).toEqual((await getReport(selection, db, "2026-07-16")).totals);
  expect(edited.largestCategory?.name).toBe("Outros");
  expect(edited.insights.find((row) => row.category === "Outros")?.kind).toBe("new");
  await updateTransaction({ id: current.id, status: "cancelled" }, db);
  expect((await load()).entries).toEqual([]);
  expect((await load()).largestExpense).toBeNull();
});

it("recognizes the installment, refreshes its edits/deletion and excludes bill payments", async () => {
  const { db, cleanup } = await createTestDatabase(); cleanups.push(cleanup);
  const card = await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 4, creditDueDay: 10 }, db);
  const checking = await createAccount({ name: "Conta", type: "checking", initialBalanceCents: 100000 }, db);
  const category = await createCategory({ name: "Compras", group: "variable_expense" }, db);
  const charge = await createCreditCardCharge({ accountId: card.id, categoryId: category.id, description: "Compra", purchaseDate: "2026-05-01", firstInvoiceMonth: "2026-06", totalAmountCents: 90000, installmentCount: 3 }, db);
  const selection = { mode: "monthly" as const, period: "2026-06" };
  const load = async () => (await getReportView(selection, "summary", db, "2026-07-16") as { summary: MonthlyRetrospective }).summary;
  expect((await load()).largestExpense).toMatchObject({ source: "installment", amountCents: 30000 });
  await updateCreditCardCharge({ id: charge.id, totalAmountCents: 60000 }, db);
  expect((await load()).totals.expenseCents).toBe(20000);
  await deleteCreditCardCharge(charge.id, db);
  expect((await load()).entries).toEqual([]);
  await createCreditCardCharge({ accountId: card.id, categoryId: category.id, description: "Nova compra", purchaseDate: "2026-05-01", firstInvoiceMonth: "2026-06", totalAmountCents: 90000, installmentCount: 3 }, db);
  await upsertCreditCardBill({ accountId: card.id, invoiceMonth: "2026-06", dueDate: "2026-06-10", statementTotalCents: 30000, currentChargesTotalCents: 30000 }, db);
  await createCreditCardBillPayment({ accountId: card.id, invoiceMonth: "2026-06", paymentAccountId: checking.id, amountCents: 30000, paymentDate: "2026-06-10", idempotencyKey: "summary-payment" }, db);
  const paid = await load();
  expect(paid.totals.expenseCents).toBe(30000);
  expect(paid.entries).toHaveLength(1);
  expect(paid.largestExpense?.amountCents).toBe(30000);
});
