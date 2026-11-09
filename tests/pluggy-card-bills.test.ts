import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pluggyAccountLinks, pluggyImportLedger, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteBill, PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { createAccount } from "@/lib/server/accounts";
import { createCreditCardBillPayment, upsertCreditCardBill } from "@/lib/server/credit-card-bills";
import { updateCreditCardCharge } from "@/lib/server/credit-card/mutations";
import { getDashboardData } from "@/lib/server/dashboard";
import { billPaymentKey } from "@/lib/server/pluggy/card-bills/link-payments";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { getReport } from "@/lib/server/reports";
import { createTestDatabase } from "@/tests/helpers/database";
import { eq } from "drizzle-orm";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

let database: Database;
let checkingId: string;
let cardId: string;
let itemId: string;
let feeds: Record<string, PluggyRemoteTransaction[]>;
let billFeeds: Record<string, PluggyRemoteBill[]>;

const bill = (month: string, totalAmount: number, overrides: Partial<PluggyRemoteBill> = {}): PluggyRemoteBill => ({ id: `bill-${month}`, dueDate: `${month}-12T00:00:00.000Z`, billClosingDate: `${month}-05T00:00:00.000Z`, totalAmount, payments: [], ...overrides });
const listed = (day: string, amount: number) => ({ paymentDate: `${day}T00:00:00.000Z`, amount });
const purchase = (id: string, month: string, amount: number, description = "Loja"): PluggyRemoteTransaction => ({ id, date: "2026-03-20T15:00:00.000Z", amount, type: "DEBIT", status: "POSTED", description, creditCardMetadata: { billId: `bill-${month}` } });
const bankPayment = (id: string, day: string, amount: number): PluggyRemoteTransaction => ({ id, date: `${day}T15:00:00.000Z`, amount: -amount, type: "DEBIT", status: "POSTED", description: "PAGAMENTO FATURA CARTAO", operationType: "OUTROS" });
const cardPaymentRecord = (id: string, day: string, amount: number): PluggyRemoteTransaction => ({ id, date: `${day}T15:00:00.000Z`, amount: -amount, type: "CREDIT", status: "POSTED", description: "PAGAMENTO RECEBIDO", operationType: "PAGAMENTO_FATURA" });

function api(): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
    listAccounts: vi.fn(async () => [{ id: "remote-bank", type: "BANK", name: "Conta" }, { id: "remote-card", type: "CREDIT", name: "Cartão" }, { id: "remote-card-2", type: "CREDIT", name: "Cartão 2" }]),
    listTransactions: vi.fn(async (accountId: string) => feeds[accountId] ?? []),
    listBills: vi.fn(async (accountId: string) => billFeeds[accountId] ?? []),
    listInvestments: vi.fn(async () => []),
  };
}

const sync = (dryRun = false) => runPluggySync({ db: database.db, client: api(), dryRun });
const bills = () => database.db.query.creditCardBills.findMany({ orderBy: (table, { asc }) => [asc(table.invoiceMonth)] });
const payments = () => database.db.query.creditCardBillPayments.findMany({ with: { transaction: true, bill: true } });
const expenseRows = () => database.db.query.transactions.findMany();
const ledgerOf = async (fingerprint: string) => (await database.db.query.pluggyImportLedger.findMany()).find((row) => row.fingerprint === fingerprint);

async function link(externalAccountId: string, accountId: string, kind: "bank" | "credit", remoteName: string, cutoffDate = "2026-01-01") {
  await database.db.insert(pluggyAccountLinks).values({ itemId, externalAccountId, accountId, remoteName, kind, cutoffDate });
}

async function addSecondCard() {
  const second = await createAccount({ name: "Cartão 2", type: "credit", initialBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12 }, database.db);
  await link("remote-card-2", second.id, "credit", "Cartão 2");
  return second.id;
}

beforeEach(async () => {
  database = await createTestDatabase();
  checkingId = (await createAccount({ name: "Conta", type: "checking", initialBalanceCents: 0 }, database.db)).id;
  cardId = (await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12 }, database.db)).id;
  [{ id: itemId }] = await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  feeds = {};
  billFeeds = {};
  pluggyRuntime().syncRunning = false;
  await link("remote-bank", checkingId, "bank", "Conta");
  await link("remote-card", cardId, "credit", "Cartão");
});

afterEach(async () => {
  database.db.$client.close();
  await database.cleanup();
});

describe("card bill import", () => {
  it("creates one row per bill and is stable on later runs", async () => {
    feeds = { "remote-card": [purchase("a", "2026-04", 100), purchase("b", "2026-05", 50)] };
    billFeeds = { "remote-card": [bill("2026-04", 100), bill("2026-05", 50)] };
    const first = await sync();
    expect(first).toMatchObject({ status: "success", summary: { counts: { cardBills: 2 } } });
    expect(await bills()).toMatchObject([
      { invoiceMonth: "2026-04", dueDate: "2026-04-12", statementTotalCents: 10000, currentChargesTotalCents: 10000, priorBalanceCents: 0, status: "open" },
      { invoiceMonth: "2026-05", statementTotalCents: 5000, currentChargesTotalCents: 5000, priorBalanceCents: 10000 },
    ]);
    const second = await sync();
    expect(second.status).toBe("success");
    expect(second.summary?.counts).not.toHaveProperty("cardBills");
    expect(second.summary?.counts).not.toHaveProperty("cardBillsUpdated");
    expect(await bills()).toHaveLength(2);
  });

  it("updates an open bill when the bank changes it", async () => {
    billFeeds = { "remote-card": [bill("2026-04", 100)] };
    await sync();
    billFeeds = { "remote-card": [bill("2026-04", 120)] };
    expect((await sync()).summary?.counts).toMatchObject({ cardBillsUpdated: 1 });
    expect((await bills())[0].statementTotalCents).toBe(12000);
  });

  it("reports non-positive bills without aborting the sync", async () => {
    billFeeds = { "remote-card": [bill("2026-04", 0), bill("2026-05", -10), bill("2026-06", 30)] };
    const run = await sync();
    expect(run.status).toBe("success");
    expect(run.summary?.counts).toMatchObject({ cardBills: 1, cardBillsSkipped: 2 });
    expect(run.summary?.attention?.map((item) => item.reason)).toEqual(["card_bill_non_positive", "card_bill_non_positive"]);
    expect((await bills()).map((row) => row.invoiceMonth)).toEqual(["2026-06"]);
  });

  it("shows each invoice's reconciliation and does not add finance charges again", async () => {
    feeds = { "remote-card": [purchase("a", "2026-04", 100), purchase("iof", "2026-04", 3.8, "IOF COMPRA"), purchase("b", "2026-05", 50)] };
    billFeeds = { "remote-card": [
      bill("2026-04", 103.8, { financeCharges: [{ type: "IOF", amount: 3.8 }] }),
      bill("2026-05", 55),
    ] };
    const { summary } = await sync();
    expect(summary?.invoices).toMatchObject([
      { accountLabel: "Cartão", invoiceMonth: "2026-04", status: "matched", differenceCents: 0, importedCents: 10380 },
      { invoiceMonth: "2026-05", status: "difference", differenceCents: 500, statementTotalCents: 5500 },
    ]);
  });

  it("stores what the imported records hold beyond the statement", async () => {
    feeds = { "remote-card": [purchase("a", "2026-04", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 90)] };
    const { summary } = await sync();
    expect((await bills())[0].ignoredAmountCents).toBe(1000);
    expect(summary?.invoices?.[0]).toMatchObject({ status: "difference", differenceCents: -1000 });
  });

  it("stores bills before the cutoff month without comparing them", async () => {
    await database.db.update(pluggyAccountLinks).set({ cutoffDate: "2026-05-01" }).where(eq(pluggyAccountLinks.kind, "credit"));
    billFeeds = { "remote-card": [bill("2026-04", 100), bill("2026-05", 50)] };
    const { summary } = await sync();
    expect(await bills()).toHaveLength(2);
    expect(summary?.invoices?.map((row) => row.invoiceMonth)).toEqual(["2026-05"]);
  });
});

describe("payments beyond a bill", () => {
  const april = () => bill("2026-04", 100, { payments: [listed("2026-04-06", 100), listed("2026-04-10", 70)] });
  const may = () => bill("2026-05", 80, { payments: [listed("2026-05-06", 80)] });

  beforeEach(() => {
    feeds = {
      "remote-bank": [bankPayment("late", "2026-05-06", 80), bankPayment("extra", "2026-04-11", 70), bankPayment("settle", "2026-04-06", 100)],
      "remote-card": [purchase("a", "2026-04", 100), purchase("b", "2026-05", 150)],
    };
    billFeeds = { "remote-card": [april(), may()] };
  });

  it("records the extra payment against the next statement and reconciles both", async () => {
    const run = await sync();
    expect(run.summary?.counts).toMatchObject({ billPaymentsLinked: 3 });
    expect(run.summary?.counts).not.toHaveProperty("billPaymentsUnlinked");
    expect(run.summary?.invoices?.map((row) => [row.invoiceMonth, row.status])).toEqual([["2026-04", "matched"], ["2026-05", "matched"]]);
    expect((await bills()).map((row) => [row.invoiceMonth, row.preStatementPaymentsCents, row.status])).toEqual([["2026-04", 0, "paid"], ["2026-05", 7000, "paid"]]);
    expect((await payments()).filter((row) => row.kind === "pre_statement")).toMatchObject([{ amountCents: 7000, bill: { invoiceMonth: "2026-05" } }]);
  });

  it("does not report the moved payment as external on later runs", async () => {
    await sync();
    const second = await sync();
    expect(second.summary?.counts).not.toHaveProperty("billPaymentsExternal");
    expect(second.summary?.invoices?.every((row) => row.status === "matched")).toBe(true);
    expect(await payments()).toHaveLength(3);
  });

  it("falls back to unlinked when no later bill exists", async () => {
    billFeeds = { "remote-card": [april()] };
    feeds["remote-bank"] = feeds["remote-bank"].filter((row) => row.id !== "late");
    const { summary } = await sync();
    expect(summary?.counts).toMatchObject({ billPaymentsLinked: 1, billPaymentsUnlinked: 1 });
  });
});

describe("payments made before the import window", () => {
  const prepaid = (amount: number) => {
    feeds = { "remote-bank": [bankPayment("old", "2026-03-20", amount), { ...bankPayment("unrelated", "2026-03-21", 5), description: "PIX ENVIADO" }], "remote-card": [purchase("a", "2026-04", 300)] };
    billFeeds = { "remote-card": [bill("2026-04", 100)] };
  };

  beforeEach(async () => {
    await database.db.delete(pluggyAccountLinks);
    await link("remote-bank", checkingId, "bank", "Conta", "2026-04-01");
    await link("remote-card", cardId, "credit", "Cartão", "2026-04-01");
  });

  it("explains the oldest bill with the bank's payments before the cutoff", async () => {
    prepaid(200);
    const { summary } = await sync();
    expect(summary?.invoices?.[0]).toMatchObject({ status: "matched", differenceCents: 0 });
    expect((await bills())[0]).toMatchObject({ preStatementPaymentsCents: 20000 });
    expect(await expenseRows()).toHaveLength(0);
  });

  it("keeps the difference visible when the payments do not explain all of it", async () => {
    prepaid(150);
    const { summary } = await sync();
    expect(summary?.invoices?.[0]).toMatchObject({ status: "difference", differenceCents: -20000 });
    expect((await bills())[0]).toMatchObject({ preStatementPaymentsCents: 0 });
  });
});

describe("bill payment linking", () => {
  it("turns a checking payment into one bill payment with one transaction and marks the bill paid", async () => {
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)], "remote-card": [purchase("a", "2026-04", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    const run = await sync();
    expect(run).toMatchObject({ status: "success", summary: { counts: { billPaymentsLinked: 1 } } });
    const [payment, ...others] = await payments();
    expect(others).toHaveLength(0);
    expect(payment).toMatchObject({ kind: "settlement", amountCents: 10000, paymentDate: "2026-04-10", idempotencyKey: "pluggy:bill-payment:pluggy:bank:pay", transaction: { accountId: checkingId, amountCents: 10000 } });
    expect(await expenseRows()).toHaveLength(1);
    expect((await bills())[0]).toMatchObject({ status: "paid", paidAt: "2026-04-10" });
    expect(await ledgerOf("pluggy:bank:pay")).toMatchObject({ outcome: "matched", localTable: "credit_card_bill_payments", localId: payment.id });
    expect(run.summary?.invoices?.[0]).toMatchObject({ status: "matched", unlinkedPaymentCents: 0 });
  });

  it("creates no duplicates and raises no conflict on a re-run", async () => {
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)], "remote-card": [purchase("a", "2026-04", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    await sync();
    const second = await sync();
    expect(second).toMatchObject({ status: "success", summary: { failures: [] } });
    expect(second.summary?.counts).not.toHaveProperty("billPaymentsLinked");
    expect(second.summary?.attention).toEqual([]);
    expect(await payments()).toHaveLength(1);
    expect(await expenseRows()).toHaveLength(1);
  });

  it("recovers through the idempotency key when the ledger write was lost", async () => {
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100)] };
    await sync();
    await database.db.update(pluggyImportLedger).set({ outcome: "pending_card_payment", localTable: null, localId: null }).where(eq(pluggyImportLedger.fingerprint, "pluggy:bank:pay"));
    const run = await sync();
    expect(run.status).toBe("success");
    const [payment, ...others] = await payments();
    expect(others).toHaveLength(0);
    expect(await ledgerOf("pluggy:bank:pay")).toMatchObject({ outcome: "matched", localId: payment.id });
  });

  it("records a payment before closing as pre_statement and leaves the bill open", async () => {
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-02", 30)] };
    billFeeds = { "remote-card": [bill("2026-04", 70, { payments: [listed("2026-04-02", 30)] })] };
    await sync();
    expect((await payments())[0]).toMatchObject({ kind: "pre_statement", bill: { invoiceMonth: "2026-04" } });
    expect((await bills())[0]).toMatchObject({ status: "open", preStatementPaymentsCents: 3000 });
  });

  it("settles a bill across several payments", async () => {
    feeds = { "remote-bank": [bankPayment("one", "2026-04-08", 40), bankPayment("two", "2026-04-11", 60)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-08", 40), listed("2026-04-11", 60)] })] };
    await sync();
    expect((await payments()).map((row) => row.kind)).toEqual(["settlement", "settlement"]);
    expect((await bills())[0].status).toBe("paid");
  });

  it("records a payment on an already paid bill as unlinked, for review", async () => {
    feeds = { "remote-bank": [bankPayment("one", "2026-04-08", 100), bankPayment("two", "2026-04-11", 60)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-08", 100), listed("2026-04-11", 60)] })] };
    const { summary, status } = await sync();
    expect(status).toBe("success");
    expect((await payments()).map((row) => [row.kind, row.billId !== null])).toEqual([["settlement", true], ["unlinked", false]]);
    expect(summary?.attention).toMatchObject([{ reason: "card_payment_unlinked", amountCents: 6000 }]);
  });

  it("records a payment with no bill as unlinked and reports it", async () => {
    feeds = { "remote-bank": [bankPayment("old", "2026-02-10", 80)] };
    billFeeds = { "remote-card": [bill("2026-04", 100)] };
    const { summary } = await sync();
    expect(await payments()).toMatchObject([{ kind: "unlinked", billId: null, amountCents: 8000 }]);
    expect(summary?.counts).toMatchObject({ billPaymentsUnlinked: 1 });
    expect(summary?.attention).toMatchObject([{ reason: "card_payment_unlinked" }]);
    expect(await ledgerOf("pluggy:bank:old")).toMatchObject({ outcome: "matched" });
  });

  it("resolves the card from the bill when there are several", async () => {
    const second = await addSecondCard();
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 200)] };
    billFeeds = { "remote-card": [bill("2026-04", 100)], "remote-card-2": [bill("2026-04", 200)] };
    await sync();
    const [payment] = await payments();
    expect(payment.bill?.accountId).toBe(second);
  });

  it("reports an ambiguity between cards and keeps the payment pending", async () => {
    await addSecondCard();
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100)], "remote-card-2": [bill("2026-04", 100)] };
    const { summary } = await sync();
    expect(await payments()).toHaveLength(0);
    expect(summary?.attention).toMatchObject([{ reason: "card_payment_ambiguous" }]);
    expect(await ledgerOf("pluggy:bank:pay")).toMatchObject({ outcome: "pending_card_payment" });
  });

  it("does not guess the card of a payment without a bill", async () => {
    await addSecondCard();
    feeds = { "remote-bank": [bankPayment("pay", "2026-02-10", 100)] };
    const { summary } = await sync();
    expect(await payments()).toHaveLength(0);
    expect(summary?.counts).toMatchObject({ billPaymentsAmbiguous: 1 });
  });

  it("waits while no card is linked or a card could not be read", async () => {
    await database.db.delete(pluggyAccountLinks).where(eq(pluggyAccountLinks.kind, "credit"));
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)] };
    expect((await sync()).summary?.counts).toMatchObject({ billPaymentsDeferred: 1 });
    await link("remote-card", cardId, "credit", "Cartão");
    const client = { ...api(), listBills: vi.fn(async () => { throw new Error("offline"); }) };
    const run = await runPluggySync({ db: database.db, client });
    expect(run.status).toBe("partial");
    expect(run.summary?.counts).toMatchObject({ billPaymentsDeferred: 1 });
    expect(await payments()).toHaveLength(0);
    expect(await ledgerOf("pluggy:bank:pay")).toMatchObject({ outcome: "pending_card_payment" });
  });

  it("adopts a payment already recorded by hand instead of creating another", async () => {
    await upsertCreditCardBill({ accountId: cardId, invoiceMonth: "2026-04", dueDate: "2026-04-12", statementTotalCents: 10000, currentChargesTotalCents: 10000 }, database.db);
    const manual = await createCreditCardBillPayment({ accountId: cardId, invoiceMonth: "2026-04", paymentAccountId: checkingId, amountCents: 10000, paymentDate: "2026-04-09", idempotencyKey: "manual-payment" }, database.db);
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    const { summary, status } = await sync();
    expect(status).toBe("success");
    expect(await payments()).toHaveLength(1);
    expect(await expenseRows()).toHaveLength(1);
    expect(await ledgerOf("pluggy:bank:pay")).toMatchObject({ outcome: "matched", localId: manual.id });
    expect(summary?.attention).toEqual([]);
  });

  it("keeps the idempotency key within the column limit", () => {
    expect(billPaymentKey("pluggy:bank:x")).toBe("pluggy:bill-payment:pluggy:bank:x");
    expect(billPaymentKey(`pluggy:bank:${"x".repeat(300)}`).length).toBeLessThanOrEqual(255);
  });
});

describe("payments seen only on the bill or the card", () => {
  it("reports a bill payment with no bank record and invents no transaction", async () => {
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    const { summary } = await sync();
    expect(await payments()).toHaveLength(0);
    expect(await expenseRows()).toHaveLength(0);
    expect((await bills())[0].status).toBe("open");
    expect(summary?.attention).toMatchObject([{ reason: "card_payment_outside_links", amountCents: 10000 }]);
    expect(summary?.invoices?.[0]).toMatchObject({ unlinkedPaymentCents: 10000 });
  });

  it("marks an invoice whose only problem is an outside payment", async () => {
    feeds = { "remote-card": [purchase("a", "2026-04", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    expect((await sync()).summary?.invoices?.[0].status).toBe("unlinked_payment");
  });

  it("does not report payments older than what the bank link reads", async () => {
    await database.db.update(pluggyAccountLinks).set({ cutoffDate: "2026-04-11" }).where(eq(pluggyAccountLinks.kind, "bank"));
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    expect((await sync()).summary?.attention).toEqual([]);
  });

  it("does not call a payment external while a bank account could not be read", async () => {
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    const base = api();
    const client = { ...base, listTransactions: vi.fn(async (accountId: string) => { if (accountId === "remote-bank") throw new Error("offline"); return base.listTransactions(accountId); }) };
    const run = await runPluggySync({ db: database.db, client });
    expect(run.status).toBe("partial");
    expect(run.summary?.attention).toEqual([]);
  });

  it("closes the card's own record of a payment against the bill", async () => {
    feeds = { "remote-card": [cardPaymentRecord("mirror", "2026-04-10", 100)], "remote-bank": [bankPayment("pay", "2026-04-10", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    await sync();
    const [stored] = await bills();
    expect(await ledgerOf("pluggy:card:mirror")).toMatchObject({ outcome: "matched", localTable: "credit_card_bills", localId: stored.id });
    expect((await database.db.query.pluggyImportLedger.findMany()).filter((row) => row.outcome === "pending_card_payment")).toHaveLength(0);
  });

  it("leaves a card record pending when no bill lists it", async () => {
    feeds = { "remote-card": [cardPaymentRecord("mirror", "2026-04-10", 100)] };
    await sync();
    expect(await ledgerOf("pluggy:card:mirror")).toMatchObject({ outcome: "pending_card_payment" });
  });
});

describe("paid bills", () => {
  const paidScenario = () => {
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)], "remote-card": [purchase("a", "2026-04", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
  };

  it("keeps a paid bill and reports what the bank changed", async () => {
    paidScenario();
    await sync();
    billFeeds = { "remote-card": [bill("2026-04", 130, { payments: [listed("2026-04-10", 100)] })] };
    const { summary } = await sync();
    expect((await bills())[0]).toMatchObject({ status: "paid", statementTotalCents: 10000 });
    expect(summary?.counts).toMatchObject({ cardBillsLocked: 1 });
    expect(summary?.attention).toMatchObject([{ reason: "card_bill_paid_changed", amountCents: 13000 }]);
  });

  it("locks the charges of a bill settled by the sync", async () => {
    paidScenario();
    await sync();
    const [charge] = await database.db.query.creditCardCharges.findMany();
    await expect(updateCreditCardCharge({ id: charge.id, description: "Outra" }, database.db)).rejects.toMatchObject({ code: "CREDIT_CARD_CHARGE_BILL_PAID" });
  });

  it("does not count the imported payment as an expense in the dashboard or reports", async () => {
    paidScenario();
    await sync();
    const data = await getDashboardData("2026-04", database.db);
    const report = await getReport({ mode: "monthly", period: "2026-04" }, database.db, "2026-05-01");
    expect(data.dashboard.totals.netResultCents).toBe(-10000);
    expect(report.totals.expenseCents).toBe(10000);
    expect(report.entries.some((row) => row.description.startsWith("Pagamento da fatura"))).toBe(false);
  });
});

describe("dry run", () => {
  it("plans the same links and writes nothing", async () => {
    feeds = { "remote-bank": [bankPayment("pay", "2026-04-10", 100)], "remote-card": [cardPaymentRecord("mirror", "2026-04-10", 100)] };
    billFeeds = { "remote-card": [bill("2026-04", 100, { payments: [listed("2026-04-10", 100)] })] };
    const { summary } = await sync(true);
    expect(summary?.counts).toMatchObject({ cardBills: 1, billPaymentsLinked: 1 });
    expect(summary).not.toHaveProperty("invoices");
    expect(await bills()).toHaveLength(0);
    expect(await payments()).toHaveLength(0);
    expect(await database.db.query.pluggyImportLedger.findMany()).toHaveLength(0);
  });
});
