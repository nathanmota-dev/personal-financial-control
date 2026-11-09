import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { financialGoalAllocations, financialGoals, pluggyImportLedger, recurringTemplates, transactionFundingLinks, transactions, transfers } from "@/lib/db/schema";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { createCreditCardCharge } from "@/lib/server/credit-card/mutations";
import { createInvestmentHolding, createInvestmentPurpose, getInvestmentPortfolioDashboard, upsertInvestmentPurposeAllocation } from "@/lib/server/investment-portfolio";
import { configureInvestmentPortfolio } from "@/lib/server/investments";
import { applyCutoverPlan } from "@/lib/server/pluggy/cutover/apply";
import { loadCutoverData, resolveCutoverWindows } from "@/lib/server/pluggy/cutover/data";
import { buildCutoverPlan } from "@/lib/server/pluggy/cutover/plan";
import { createRecurringTemplate, generateRecurringTransactions } from "@/lib/server/recurring";
import { createTransaction } from "@/lib/server/transactions";
import { seedCutoverDatabase, snapshotAllTables } from "@/tests/helpers/pluggy-cutover";

type Seed = Awaited<ReturnType<typeof seedCutoverDatabase>>;

let seed: Seed;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
  seed = await seedCutoverDatabase();
});

afterEach(async () => {
  seed.db.$client.close();
  await seed.cleanup();
  vi.useRealTimers();
});

const expense = (date: string, description: string, accountId = seed.checking.id, extra: Record<string, unknown> = {}) => createTransaction({ accountId, categoryId: seed.category.id, type: "expense", status: "posted", amountCents: 1000, transactionDate: date, competenceMonth: date.slice(0, 7), description, ...extra }, seed.db);
const charge = (firstInvoiceMonth: string, installmentCount: number, description: string, extra: Record<string, unknown> = {}) => createCreditCardCharge({ accountId: seed.card.id, categoryId: seed.category.id, description, purchaseDate: `${firstInvoiceMonth}-02`, totalAmountCents: 4000, installmentCount, kind: "purchase", firstInvoiceMonth, ...extra }, seed.db);
const bill = (invoiceMonth: string, statementTotalCents = 1000) => upsertCreditCardBill({ accountId: seed.card.id, invoiceMonth, dueDate: `${invoiceMonth}-12`, statementTotalCents, currentChargesTotalCents: statementTotalCents }, seed.db);
const payBill = (invoiceMonth: string, paymentDate: string, key: string, amountCents = 1000) => createCreditCardBillPayment({ accountId: seed.card.id, invoiceMonth, paymentAccountId: seed.checking.id, amountCents, paymentDate, kind: "settlement", idempotencyKey: key }, seed.db);
const plan = () => buildCutoverPlan(seed.db);
const apply = async () => {
  const built = await plan();
  await applyCutoverPlan(seed.db, built);
  return built;
};
const descriptions = async () => (await seed.db.query.transactions.findMany()).map((row) => row.description).sort();

describe("cutover windows", () => {
  it("uses the earliest cutoff per local account and ignores disabled links", async () => {
    await seed.link("remote-bank-2", seed.checking.id, "bank", "2026-02-01");
    await seed.link("remote-wallet", seed.wallet.id, "bank", "2026-01-01", false);
    const windows = resolveCutoverWindows(await loadCutoverData(seed.db));
    expect(windows.map(({ accountName, cutoffDate, cutoffMonth, kind }) => ({ accountName, cutoffDate, cutoffMonth, kind }))).toEqual([
      { accountName: "Cartão", cutoffDate: "2026-04-01", cutoffMonth: "2026-04", kind: "credit" },
      { accountName: "Conta", cutoffDate: "2026-02-01", cutoffMonth: "2026-02", kind: "bank" },
    ]);
  });

  it("applies each account's own cutoff and preserves what is before it or unlinked", async () => {
    await expense("2026-02-28", "antes da conta");
    await expense("2026-03-01", "no corte");
    await expense("2026-03-20", "depois do corte", seed.wallet.id);
    await expense("2026-03-20", "no cartao antes do corte", seed.card.id);
    await expense("2026-04-01", "no cartao no corte", seed.card.id);
    await apply();
    expect(await descriptions()).toEqual(["antes da conta", "depois do corte", "no cartao antes do corte"]);
  });

  it("removes every status inside the window", async () => {
    await expense("2026-05-01", "pendente", seed.checking.id, { status: "pending" });
    await expense("2026-05-02", "cancelada", seed.checking.id, { status: "cancelled" });
    expect((await apply()).totals.transactions).toBe(2);
    expect(await descriptions()).toEqual([]);
  });
});

describe("cutover deletion order", () => {
  it("removes paid bills and charges straddling the window, keeping the paid bill before it", async () => {
    await charge("2026-01", 1, "antiga");
    await charge("2026-03", 4, "atravessa");
    await charge("2026-05", 1, "nova");
    await bill("2026-03");
    await payBill("2026-03", "2026-02-20", "manual-marco");
    await bill("2026-04");
    await payBill("2026-04", "2026-04-10", "manual-abril");
    const built = await apply();
    expect(built.totals).toMatchObject({ credit_card_bills: 1, credit_card_bill_payments: 1, credit_card_charges: 2, credit_card_installments: 5 });
    expect(built.warnings.straddlingCharges).toMatchObject([{ description: "atravessa", outsideInstallments: [{ installmentNumber: 1, invoiceMonth: "2026-03", amountCents: 1000, onPaidBill: true }] }]);
    expect((await seed.db.query.creditCardBills.findMany()).map((row) => row.invoiceMonth)).toEqual(["2026-03"]);
    expect((await seed.db.query.creditCardCharges.findMany()).map((row) => row.description)).toEqual(["antiga"]);
    expect(await seed.db.query.creditCardInstallments.findMany()).toHaveLength(1);
    expect(await seed.db.query.creditCardBillPayments.findMany()).toHaveLength(1);
  });

  it("reports payments left without a bill and payments removed from a bill that stays", async () => {
    await bill("2026-04");
    await payBill("2026-04", "2026-02-25", "fora-da-janela-bancaria");
    await bill("2026-02");
    await payBill("2026-02", "2026-03-15", "dentro-da-janela-bancaria");
    const { warnings } = await apply();
    expect(warnings.detachedBillPayments).toMatchObject([{ paymentDate: "2026-02-25", invoiceMonth: "2026-04" }]);
    expect(warnings.paymentsOnKeptBills).toMatchObject([{ paymentDate: "2026-03-15", invoiceMonth: "2026-02" }]);
    expect((await seed.db.query.creditCardBillPayments.findMany()).map((row) => row.billId)).toEqual([null]);
  });
});

describe("cutover and investments", () => {
  async function funded() {
    const holding = await createInvestmentHolding({ name: "Fundo", assetClass: "funds", instrumentType: "investment_fund", currentValueCents: 80000, valueAsOf: "2026-07-16" }, seed.db);
    const purpose = await createInvestmentPurpose({ name: "Reserva" }, seed.db);
    const allocation = await upsertInvestmentPurposeAllocation({ holdingId: holding.id, purposeId: purpose.id, amountCents: 80000, allocatedOn: "2026-07-16" }, seed.db);
    await configureInvestmentPortfolio({ checkpointBalanceCents: 80000, expectedMonthlyRateBps: 0, checkpointDate: "2026-07-01" }, seed.db);
    return { sourceSelections: [{ sourceId: `allocation:${allocation.id}`, amountCents: 25000 }] };
  }
  const holdingValue = async () => (await getInvestmentPortfolioDashboard(seed.db)).holdings[0]?.currentValueCents;

  it("removes a funding pair through its expense and restores the holding", async () => {
    const { sourceSelections } = await funded();
    await expense("2026-07-10", "paga com investimento", seed.checking.id, { amountCents: 25000, fundingSource: "investments", sourceSelections });
    expect(await holdingValue()).toBe(55000);
    const built = await apply();
    expect(built.totals).toMatchObject({ transactions: 2, transaction_funding_links: 1, investment_reduction_events_reversed: 1 });
    expect(built.warnings.investmentReversals).toMatchObject([{ amountCents: 25000 }]);
    expect(await holdingValue()).toBe(80000);
    expect(await descriptions()).toEqual([]);
    expect(await seed.db.query.transactionFundingLinks.findMany()).toEqual([]);
  });

  it("reverses a standalone withdrawal instead of leaving the holding reduced", async () => {
    const { sourceSelections } = await funded();
    const category = await createCategory({ name: "Aplicações", group: "investment" }, seed.db);
    await createTransaction({ accountId: seed.checking.id, categoryId: category.id, type: "investment_withdrawal", status: "posted", amountCents: 25000, transactionDate: "2026-07-10", competenceMonth: "2026-07", description: "resgate", sources: undefined, sourceSelections }, seed.db);
    expect(await holdingValue()).toBe(55000);
    expect((await apply()).totals.investment_reduction_events_reversed).toBe(1);
    expect(await holdingValue()).toBe(80000);
  });

  it("does not change a holding when nothing reduced it", async () => {
    await funded();
    await expense("2026-05-01", "comum");
    await apply();
    expect(await holdingValue()).toBe(80000);
  });

  async function pair(expenseDate: string, withdrawalDate: string) {
    const raw = (date: string, description: string, type: "expense" | "investment_withdrawal") => seed.db.insert(transactions).values({ accountId: seed.checking.id, type, status: "posted", amountCents: 500, transactionDate: date, competenceMonth: date.slice(0, 7), description, isIncludedInInvestmentCheckpoint: true }).returning();
    const [spending] = await raw(expenseDate, "despesa", "expense");
    const [withdrawal] = await raw(withdrawalDate, "resgate gerenciado", "investment_withdrawal");
    await seed.db.insert(transactionFundingLinks).values({ expenseTransactionId: spending.id, withdrawalTransactionId: withdrawal.id, type: "investment_funded_expense" });
  }

  it("keeps a managed withdrawal whose expense stays, avoiding MANAGED_TRANSACTION", async () => {
    await pair("2026-02-10", "2026-03-10");
    const built = await apply();
    expect(built.warnings.managedWithdrawalsKept).toMatchObject([{ description: "resgate gerenciado" }]);
    expect(await descriptions()).toEqual(["despesa", "resgate gerenciado"]);
  });

  it("reports a withdrawal outside the window that leaves with its expense", async () => {
    await pair("2026-03-10", "2026-02-10");
    const built = await apply();
    expect(built.warnings.fundingWithdrawalsOutsideWindow).toMatchObject([{ description: "resgate gerenciado" }]);
    expect(await descriptions()).toEqual([]);
  });
});

describe("cutover transfers", () => {
  const transfer = (fromAccountId: string, toAccountId: string, transferDate: string) => seed.db.insert(transfers).values({ fromAccountId, toAccountId, amountCents: 100, transferDate, competenceMonth: transferDate.slice(0, 7), description: `t-${transferDate}` });

  it("counts a transfer inside both windows once", async () => {
    await transfer(seed.checking.id, seed.card.id, "2026-05-01");
    const built = await apply();
    expect(built.totals.transfers).toBe(1);
    expect(built.warnings.transfersCrossingWindow).toEqual([]);
    expect(await seed.db.query.transfers.findMany()).toEqual([]);
  });

  it("reports a transfer whose other side is unlinked or starts later, and keeps older ones", async () => {
    await transfer(seed.wallet.id, seed.checking.id, "2026-03-05");
    await transfer(seed.checking.id, seed.card.id, "2026-03-06");
    await transfer(seed.checking.id, seed.wallet.id, "2026-02-01");
    const built = await apply();
    expect(built.totals.transfers).toBe(2);
    expect(built.warnings.transfersCrossingWindow.map((row) => row.date).sort()).toEqual(["2026-03-05", "2026-03-06"]);
    expect((await seed.db.query.transfers.findMany()).map((row) => row.transferDate)).toEqual(["2026-02-01"]);
  });
});

describe("cutover recurring templates", () => {
  const template = (accountId: string, description: string, endMonth?: string) => createRecurringTemplate({ accountId, categoryId: seed.category.id, type: "expense", amountCents: 500, dayOfMonth: 5, startMonth: "2026-01", endMonth, name: description }, seed.db);

  it("pauses templates the bank covers, so deleted months are not recreated", async () => {
    await template(seed.checking.id, "aluguel");
    await template(seed.wallet.id, "mesada");
    await template(seed.checking.id, "encerrada", "2026-02");
    await generateRecurringTransactions("2026-05", seed.db);
    expect(await descriptions()).toEqual(["aluguel", "mesada"]);
    const built = await apply();
    expect(built.totals.recurring_templates_paused).toBe(1);
    const created = await generateRecurringTransactions("2026-05", seed.db);
    expect(created).toEqual([]);
    expect(await descriptions()).toEqual(["mesada"]);
    const rows = await seed.db.query.recurringTemplates.findMany();
    expect(Object.fromEntries(rows.map((row) => [row.description, row.status]))).toEqual({ aluguel: "paused", mesada: "active", encerrada: "active" });
  });

  it("leaves an already paused template alone", async () => {
    const created = await template(seed.checking.id, "pausada");
    await seed.db.update(recurringTemplates).set({ status: "paused" });
    expect((await plan()).accounts.flatMap((account) => account.templateIds)).not.toContain(created.id);
  });
});

describe("cutover safety", () => {
  it("writes nothing while planning", async () => {
    await expense("2026-05-01", "janela");
    await charge("2026-05", 2, "compra");
    await bill("2026-05");
    const before = await snapshotAllTables(seed.db);
    const built = await plan();
    expect(built.totals).toMatchObject({ transactions: 1, credit_card_charges: 1, credit_card_installments: 2, credit_card_bills: 1 });
    expect(await snapshotAllTables(seed.db)).toBe(before);
  });

  it("keeps bank records, which the ledger would never let come back, and is a no-op when repeated", async () => {
    await expense("2026-05-01", "do banco", seed.checking.id, { importFingerprint: "pluggy:bank:1" });
    await expense("2026-05-02", "conciliada");
    const [matched] = await seed.db.query.transactions.findMany({ where: (table, { eq }) => eq(table.description, "conciliada") });
    await seed.db.insert(pluggyImportLedger).values({ fingerprint: "pluggy:bank:2", outcome: "matched", localTable: "transactions", localId: matched.id, lastSeenAt: new Date() });
    const [own] = await seed.db.insert(transfers).values({ fromAccountId: seed.checking.id, toAccountId: seed.wallet.id, amountCents: 1, transferDate: "2026-05-03", competenceMonth: "2026-05", description: "propria" }).returning();
    await seed.db.insert(pluggyImportLedger).values({ fingerprint: "pluggy:bank:3", outcome: "created", localTable: "transfers", localId: own.id, lastSeenAt: new Date() });
    await charge("2026-05", 1, "fatura importada", { importFingerprint: "pluggy:card:1" });
    await bill("2026-05");
    await bill("2026-06");
    await payBill("2026-06", "2026-06-10", "pluggy:bill-payment:1");
    const built = await plan();
    expect(built.preserved).toEqual({ transactions: 3, charges: 1, transfers: 1, bills: 1 });
    expect(Object.values(built.totals).every((count) => count === 0)).toBe(true);
    await applyCutoverPlan(seed.db, built);
    expect(await descriptions()).toHaveLength(3);
    expect(await seed.db.query.creditCardBills.findMany()).toHaveLength(2);
  });

  it("reports the goal allocations that lose their transaction", async () => {
    const created = await expense("2026-05-01", "aporte");
    const [goal] = await seed.db.insert(financialGoals).values({ name: "Viagem", category: "travel", targetAmountCents: 100, plannedMonthlyContributionCents: 10 }).returning();
    await seed.db.insert(financialGoalAllocations).values({ goalId: goal.id, transactionId: created.id, type: "contribution", amountCents: 10, occurredOn: "2026-05-01" });
    const built = await apply();
    expect(built.totals.financial_goal_allocations_unlinked).toBe(1);
    expect(built.warnings.goalAllocations).toEqual([expect.objectContaining({ goalName: "Viagem", amountCents: 10, transactionId: created.id })]);
    expect((await seed.db.query.financialGoalAllocations.findMany())[0].transactionId).toBeNull();
  });

  it("rolls an account back when a reversal fails, leaving the others applied", async () => {
    const other = await createAccount({ name: "Zeta", type: "checking", initialBalanceCents: 0 }, seed.db);
    await seed.link("remote-zeta", other.id, "bank", "2026-01-01");
    await expense("2026-05-01", "primeira");
    await expense("2026-05-01", "segunda", other.id);
    const built = await plan();
    const zeta = built.accounts.find((account) => account.window.accountName === "Zeta")!;
    zeta.managedTransactionIds.push("00000000-0000-4000-8000-000000000000");
    await expect(applyCutoverPlan(seed.db, built)).rejects.toThrow();
    expect(await descriptions()).toEqual(["segunda"]);
  });
});
