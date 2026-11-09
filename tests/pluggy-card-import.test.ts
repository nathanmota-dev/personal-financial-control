import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { creditCardBills, pluggyAccountLinks, pluggyImportLedger, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteBill, PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { createAccount } from "@/lib/server/accounts";
import { createCategory } from "@/lib/server/categories";
import { deleteCreditCardCharge, updateCreditCardCharge } from "@/lib/server/credit-card/mutations";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;
type Meta = NonNullable<PluggyRemoteTransaction["creditCardMetadata"]>;

let database: Database;
let cardId: string;
let itemId: string;
let feed: PluggyRemoteTransaction[];
let bills: PluggyRemoteBill[];

const bill = (month: string): PluggyRemoteBill => ({ id: `bill-${month}`, dueDate: `${month}-12T00:00:00.000Z` });
const record = (id: string, overrides: Partial<PluggyRemoteTransaction> = {}, meta: Meta = {}): PluggyRemoteTransaction => ({ id, date: "2026-03-20T15:00:00.000Z", amount: 100, type: "DEBIT", status: "POSTED", description: "Loja", creditCardMetadata: meta, ...overrides });
const part = (id: string, number: number, total: number, month: string | null, amount: number, overrides: Partial<PluggyRemoteTransaction> = {}, meta: Meta = {}) => record(id, { amount, ...overrides }, { installmentNumber: number, totalInstallments: total, billId: month ? `bill-${month}` : null, purchaseDate: "2026-03-20T00:00:00.000Z", ...meta });
const threeParts = () => [part("p1", 1, 3, "2026-04", 33.34), part("p2", 2, 3, "2026-05", 33.33), part("p3", 3, 3, "2026-06", 33.33)];

function api(): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
    listAccounts: vi.fn(async () => [{ id: "remote-card", type: "CREDIT", name: "Cartão" }]),
    listTransactions: vi.fn(async () => feed),
    listBills: vi.fn(async () => bills),
    listInvestments: vi.fn(async () => []),
  };
}

const sync = (dryRun = false) => runPluggySync({ db: database.db, client: api(), dryRun });
const charges = () => database.db.query.creditCardCharges.findMany({ with: { installments: { orderBy: (table, { asc }) => [asc(table.installmentNumber)] }, category: true } });
const ledger = () => database.db.query.pluggyImportLedger.findMany();
const invoiceTotal = async (month: string) => (await charges()).flatMap((charge) => charge.installments).filter((item) => item.invoiceMonth === month).reduce((sum, item) => sum + item.amountCents, 0);

async function link(accountId: string, cutoffDate = "2026-01-01") {
  await database.db.insert(pluggyAccountLinks).values({ itemId, externalAccountId: "remote-card", accountId, remoteName: "Cartão", kind: "credit", cutoffDate });
}

async function markPaid(invoiceMonth: string) {
  await database.db.insert(creditCardBills).values({ accountId: cardId, invoiceMonth, dueDate: `${invoiceMonth}-12`, statementTotalCents: 1, currentChargesTotalCents: 1, priorBalanceCents: 0, preStatementPaymentsCents: 0, ignoredAmountCents: 0, status: "paid", paidAt: `${invoiceMonth}-12`, updatedAt: new Date() });
}

beforeEach(async () => {
  database = await createTestDatabase();
  cardId = (await createAccount({ name: "Cartão", type: "credit", initialBalanceCents: 0, creditClosingDay: 5, creditDueDay: 12 }, database.db)).id;
  [{ id: itemId }] = await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  feed = [];
  bills = ["2026-03", "2026-04", "2026-05", "2026-06"].map(bill);
  pluggyRuntime().syncRunning = false;
  await link(cardId);
});

afterEach(async () => {
  database.db.$client.close();
  await database.cleanup();
});

describe("card purchase import", () => {
  it("creates one charge with its installments in the correct invoice months", async () => {
    feed = threeParts();
    const run = await sync();
    expect(run).toMatchObject({ status: "success", summary: { counts: { cardPurchases: 1 } } });
    const [charge, ...others] = await charges();
    expect(others).toHaveLength(0);
    expect(charge).toMatchObject({ totalAmountCents: 10000, installmentCount: 3, firstInvoiceMonth: "2026-04", purchaseDate: "2026-03-20", kind: "purchase", notes: null });
    expect(charge.category.name).toBe("A classificar");
    expect(charge.installments.map((item) => [item.invoiceMonth, item.amountCents])).toEqual([["2026-04", 3334], ["2026-05", 3333], ["2026-06", 3333]]);
    expect(await ledger()).toMatchObject([{ outcome: "created", localTable: "credit_card_charges", localId: charge.id }]);
  });

  it("matches the bank's purchases in each imported invoice", async () => {
    const market = { description: "Mercado" };
    feed = [...threeParts(), part("q1", 1, 2, "2026-04", 50, market), part("q2", 2, 2, "2026-05", 50, market), record("single", { amount: 12.5 }, { billId: "bill-2026-04" })];
    await sync();
    expect(await invoiceTotal("2026-04")).toBe(3334 + 5000 + 1250);
    expect(await invoiceTotal("2026-05")).toBe(3333 + 5000);
    expect(await invoiceTotal("2026-06")).toBe(3333);
    for (const charge of await charges()) expect(charge.installments.reduce((sum, item) => sum + item.amountCents, 0)).toBe(charge.totalAmountCents);
  });

  it("rebuilds a purchase first seen at installment k", async () => {
    feed = [part("k3", 3, 4, "2026-06", 25)];
    await sync();
    const [charge] = await charges();
    expect(charge).toMatchObject({ firstInvoiceMonth: "2026-04", totalAmountCents: 10000, installmentCount: 4 });
    expect(charge.installments.map((item) => item.invoiceMonth)).toEqual(["2026-04", "2026-05", "2026-06", "2026-07"]);
  });

  it("merges later deliveries into the same charge", async () => {
    feed = [part("p1", 1, 3, "2026-04", 33.34)];
    const first = await sync();
    expect(first.summary?.counts).toMatchObject({ cardPurchases: 1, cardResidual: 1 });
    expect((await charges())[0].totalAmountCents).toBe(10002);
    feed = [part("p1", 1, 3, "2026-04", 33.34), part("p2", 2, 3, "2026-05", 33.33)];
    const second = await sync();
    expect(second.summary?.counts).toMatchObject({ cardUpdated: 1 });
    expect(second.summary?.counts).not.toHaveProperty("cardPurchases");
    const [charge, ...others] = await charges();
    expect(others).toHaveLength(0);
    expect(charge.totalAmountCents).toBe(10000);
    expect((await sync()).summary?.counts).not.toHaveProperty("cardUpdated");
    expect(await ledger()).toHaveLength(1);
  });

  it("keeps two identical purchases of a month separate", async () => {
    feed = [part("a1", 1, 2, "2026-04", 50), part("b1", 1, 2, "2026-04", 50), part("a2", 2, 2, "2026-05", 50), part("b2", 2, 2, "2026-05", 50)];
    await sync();
    await sync();
    expect((await charges()).map((charge) => charge.totalAmountCents)).toEqual([10000, 10000]);
  });

  it("reduces the invoice with a refund and creates no purchase for a bill payment", async () => {
    feed = [record("buy", { amount: 100 }, { billId: "bill-2026-04" }), record("refund", { amount: -30, description: "ESTORNO LOJA", operationType: "OUTROS" }, { billId: "bill-2026-04" }), record("pay", { amount: -500, description: "PAGAMENTO RECEBIDO", operationType: "PAGAMENTO_FATURA" }), record("pay-2", { amount: -10, description: "PAGAMENTO EM ABERTO", status: "PENDING" })];
    const run = await sync();
    expect(run.summary?.counts).toMatchObject({ cardPurchases: 1, cardRefunds: 1, cardBillPayment: 1, cardDeferred: 1 });
    expect(await charges()).toHaveLength(2);
    expect(await invoiceTotal("2026-04")).toBe(7000);
    expect((await charges()).find((charge) => charge.kind === "adjustment")).toMatchObject({ totalAmountCents: -3000, installmentCount: 1 });
    expect((await ledger()).filter((entry) => entry.outcome === "pending_card_payment")).toEqual([expect.objectContaining({ fingerprint: "pluggy:card:pay", localId: null })]);
    await sync();
    expect((await ledger()).filter((entry) => entry.outcome === "pending_card_payment")).toHaveLength(1);
  });

  it("keeps a category edit and raises no conflict on the next sync", async () => {
    feed = threeParts();
    await sync();
    const [charge] = await charges();
    const category = await createCategory({ name: "Lojas", group: "variable_expense" }, database.db);
    await updateCreditCardCharge({ id: charge.id, categoryId: category.id }, database.db);
    const run = await sync();
    expect(run.status).toBe("success");
    expect((await charges())[0]).toMatchObject({ categoryId: category.id, firstInvoiceMonth: "2026-04", totalAmountCents: 10000 });
  });

  it("applies a learned rule when creating a purchase", async () => {
    feed = [record("a", {}, { billId: "bill-2026-04" })];
    await sync();
    const category = await createCategory({ name: "Lojas", group: "variable_expense" }, database.db);
    await updateCreditCardCharge({ id: (await charges())[0].id, categoryId: category.id }, database.db);
    feed.push(record("b", {}, { billId: "bill-2026-05" }));
    await sync();
    expect((await charges()).map((charge) => charge.categoryId)).toEqual([category.id, category.id]);
  });

  it("reports a remote change on a paid bill as a no-op", async () => {
    feed = [part("p1", 1, 3, "2026-04", 33.34)];
    await sync();
    await markPaid("2026-04");
    feed = threeParts();
    for (const dryRun of [true, false]) {
      const run = await sync(dryRun);
      expect(run.status).toBe("success");
      expect(run.summary?.counts).toMatchObject({ cardLocked: 1 });
      expect(run.summary?.attention).toMatchObject([{ reason: "card_locked_by_paid_bill", description: "Loja", amountCents: 10000 }]);
    }
    expect((await charges())[0].totalAmountCents).toBe(10002);
  });

  it("stores the amounts and months the bank states and follows them until the invoice is paid", async () => {
    feed = [part("p1", 1, 2, "2026-04", 50.01), part("p2", 2, 2, null, 50)];
    await sync();
    const installments = async () => (await database.db.query.creditCardInstallments.findMany()).sort((left, right) => left.installmentNumber - right.installmentNumber).map((row) => [row.amountCents, row.invoiceMonth]);
    expect(await installments()).toEqual([[5001, "2026-04"], [5000, "2026-05"]]);
    feed = [part("p1", 1, 2, "2026-04", 50.01), part("p2", 2, 2, "2026-06", 50)];
    await sync();
    expect(await installments()).toEqual([[5001, "2026-04"], [5000, "2026-06"]]);
  });

  it("imports a foreign purchase in the account currency and reports one without it", async () => {
    feed = [record("usd", { amount: 10, currencyCode: "USD", amountInAccountCurrency: 55.5 }, { billId: "bill-2026-04" }), record("usd-2", { amount: 20, currencyCode: "USD" })];
    const run = await sync();
    expect((await charges()).map((charge) => charge.totalAmountCents)).toEqual([5550]);
    expect(run.summary?.counts).toMatchObject({ cardPurchases: 1, cardIgnored: 1 });
    expect(run.summary?.attention).toMatchObject([{ reason: "card_missing_account_currency" }]);
  });

  it("marks an approximate purchase date and replaces it when the real one arrives", async () => {
    feed = [part("p2", 2, 2, "2026-05", 50, {}, { purchaseDate: null })];
    await sync();
    expect((await charges())[0]).toMatchObject({ purchaseDate: "2026-04-05", notes: expect.stringContaining("Data aproximada") });
    feed = [part("p1", 1, 2, "2026-04", 50, {}, { purchaseDate: null }), ...feed];
    await sync();
    expect((await charges())[0]).toMatchObject({ purchaseDate: "2026-03-20", notes: null });
  });

  it("reports the residual only when a total is written", async () => {
    feed = [part("p3", 3, 3, "2026-06", 33.33)];
    expect((await sync()).summary).toMatchObject({ counts: { cardResidual: 1 }, attention: [{ reason: "card_total_residual", amountCents: 2 }] });
    expect((await sync()).summary?.attention).toEqual([]);
  });

  it("plans the same counts on a dry run without writing", async () => {
    feed = [...threeParts(), record("refund", { amount: -30, description: "ESTORNO" }), record("pay", { amount: -500, description: "PAGAMENTO" })];
    const run = await sync(true);
    expect(run.summary?.counts).toMatchObject({ cardPurchases: 1, cardRefunds: 1, cardBillPayment: 1 });
    expect(await charges()).toHaveLength(0);
    expect(await ledger()).toHaveLength(0);
    expect(await database.db.query.categories.findFirst({ where: (table, { eq }) => eq(table.name, "A classificar") })).toBeUndefined();
  });

  it("does not bring back a charge the user deleted", async () => {
    feed = threeParts();
    await sync();
    await deleteCreditCardCharge((await charges())[0].id, database.db);
    expect((await sync()).summary?.counts).not.toHaveProperty("cardPurchases");
    expect(await charges()).toHaveLength(0);
  });

  it("restores a missing ledger entry from the charge", async () => {
    feed = threeParts();
    await sync();
    await database.db.delete(pluggyImportLedger);
    const run = await sync();
    expect(run.summary?.counts).not.toHaveProperty("cardPurchases");
    expect(await ledger()).toHaveLength(1);
  });

  it("ignores unmappable records", async () => {
    feed = [record("zero", { amount: 0 })];
    expect((await sync()).summary?.counts).toMatchObject({ cardIgnored: 1 });
    expect(await charges()).toHaveLength(0);
  });

  describe("validation", () => {
    it("skips a card linked to an account that is not a card and reports why", async () => {
      await database.db.delete(pluggyAccountLinks);
      await link((await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 0 }, database.db)).id);
      feed = threeParts();
      const run = await sync();
      expect(run).toMatchObject({ status: "partial", summary: { failures: [{ code: "PLUGGY_CARD_ACCOUNT_INVALID", label: "Cartão" }] } });
      expect(await charges()).toHaveLength(0);
    });

    it("skips a card without a closing day and reports why", async () => {
      await database.db.delete(pluggyAccountLinks);
      await link((await createAccount({ name: "Sem fechamento", type: "credit", initialBalanceCents: 0 }, database.db)).id);
      feed = threeParts();
      expect((await sync()).summary?.failures).toMatchObject([{ code: "PLUGGY_CARD_CLOSING_DAY_MISSING" }]);
    });

    it("fails the link when the bills cannot be read", async () => {
      feed = threeParts();
      const client = api();
      client.listBills = vi.fn(async () => { throw new Error("offline"); });
      const run = await runPluggySync({ db: database.db, client });
      expect(run.summary?.failures).toMatchObject([{ step: "import-card-purchases", code: "PLUGGY_STEP_FAILED" }]);
      expect(await charges()).toHaveLength(0);
    });

    it("ignores a bill with an invalid due date", async () => {
      bills = [{ id: "bill-2026-04", dueDate: "invalid" }];
      feed = [record("a", { date: "2026-03-20T15:00:00.000Z" }, { billId: "bill-2026-04" })];
      await sync();
      expect((await charges())[0].firstInvoiceMonth).toBe("2026-04");
    });
  });

  describe("cutoff", () => {
    beforeEach(async () => {
      await database.db.delete(pluggyAccountLinks);
      await link(cardId, "2026-04-15");
    });

    it("ignores a purchase whose invoices all precede the cutoff", async () => {
      feed = [record("old", {}, { billId: "bill-2026-03" })];
      expect((await sync()).summary?.counts).toMatchObject({ cardIgnored: 1 });
      expect(await charges()).toHaveLength(0);
    });

    it("keeps a purchase that started earlier but has installments inside the window", async () => {
      feed = [part("p3", 2, 3, "2026-04", 50, {}, { purchaseDate: "2026-02-20T00:00:00.000Z" })];
      await sync();
      expect(await charges()).toMatchObject([{ firstInvoiceMonth: "2026-03", installmentCount: 3 }]);
    });

    it("does not cancel a provisional purchase older than the cutoff", async () => {
      await database.db.delete(pluggyAccountLinks);
      await link(cardId, "2026-01-01");
      feed = [record("pending", { status: "PENDING", date: "2026-03-01T15:00:00.000Z", amount: 20 })];
      await sync();
      await database.db.delete(pluggyAccountLinks);
      await link(cardId, "2026-04-15");
      feed = [];
      expect((await sync()).summary?.counts).not.toHaveProperty("cardCancelled");
      expect(await charges()).toHaveLength(1);
    });
  });

  describe("pending records", () => {
    const pending = (id: string, overrides: Partial<PluggyRemoteTransaction> = {}) => record(id, { status: "PENDING", ...overrides });

    it("replaces a pending record recreated as posted under a new id", async () => {
      feed = [pending("old")];
      await sync();
      const [before] = await charges();
      expect(await ledger()).toMatchObject([{ outcome: "pending_card_charge", fingerprint: "pluggy:card:old" }]);
      feed = [record("new", { date: "2026-03-22T15:00:00.000Z" }, { billId: "bill-2026-05" })];
      const run = await sync();
      expect(run.summary?.counts).toMatchObject({ cardUpdated: 1 });
      const [after, ...others] = await charges();
      expect(others).toHaveLength(0);
      expect(after).toMatchObject({ id: before.id, importFingerprint: "pluggy:card:new", firstInvoiceMonth: "2026-05", purchaseDate: "2026-03-22" });
      expect(await ledger()).toMatchObject([{ fingerprint: "pluggy:card:new", outcome: "created", localId: before.id }]);
    });

    it("confirms a pending purchase when the same record posts", async () => {
      feed = [pending("same")];
      await sync();
      feed = [record("same", {}, { billId: "bill-2026-04" })];
      await sync();
      expect(await ledger()).toMatchObject([{ outcome: "created" }]);
      expect(await charges()).toHaveLength(1);
    });

    it("updates the amount and date of a record that is still pending", async () => {
      feed = [pending("same")];
      await sync();
      feed = [pending("same", { amount: 90, date: "2026-03-19T15:00:00.000Z", creditCardMetadata: { purchaseDate: "2026-03-19" } })];
      expect((await sync()).summary?.counts).toMatchObject({ cardUpdated: 1 });
      expect((await charges())[0]).toMatchObject({ totalAmountCents: 9000, purchaseDate: "2026-03-19" });
    });

    it("moves pending installments to the billed invoice under the same charge", async () => {
      const unbilled = (id: string, number: number) => part(id, number, 2, null, 50, { status: "PENDING" }, { purchaseDate: "2026-03-05T00:00:00.000Z" });
      feed = [unbilled("a1", 1), unbilled("a2", 2)];
      await sync();
      expect((await charges())[0].firstInvoiceMonth).toBe("2026-03");
      feed = [part("b1", 1, 2, "2026-04", 50, {}, { purchaseDate: "2026-03-05T00:00:00.000Z" }), unbilled("a2", 2)];
      await sync();
      const [charge, ...others] = await charges();
      expect(others).toHaveLength(0);
      expect(charge).toMatchObject({ firstInvoiceMonth: "2026-04", totalAmountCents: 10000 });
      expect(charge.installments.map((item) => item.invoiceMonth)).toEqual(["2026-04", "2026-05"]);
    });

    it("does not adopt a pending record that is still at the bank", async () => {
      feed = [pending("old")];
      await sync();
      feed = [pending("old"), record("other", {}, { billId: "bill-2026-04" })];
      await sync();
      expect(await charges()).toHaveLength(2);
    });

    it("does not adopt across a different amount or a distant date", async () => {
      feed = [pending("old")];
      await sync();
      feed = [record("other", { amount: 120 }, { billId: "bill-2026-04" }), record("far", { date: "2026-03-29T15:00:00.000Z" }, { billId: "bill-2026-04" })];
      const run = await sync();
      expect(run.summary?.counts).toMatchObject({ cardPurchases: 2, cardCancelled: 1 });
      expect((await charges()).map((charge) => charge.importFingerprint).sort()).toEqual(["pluggy:card:far", "pluggy:card:other"]);
    });

    it("removes a pending purchase the bank dropped and restores it if it returns", async () => {
      feed = [pending("gone")];
      await sync();
      feed = [];
      expect((await sync()).summary?.counts).toMatchObject({ cardCancelled: 1 });
      expect(await charges()).toHaveLength(0);
      expect(await ledger()).toMatchObject([{ outcome: "cancelled", localId: null }]);
      expect((await sync()).summary?.counts).not.toHaveProperty("cardCancelled");
      feed = [pending("gone")];
      expect((await sync()).summary?.counts).toMatchObject({ cardPurchases: 1 });
      expect(await charges()).toHaveLength(1);
      expect(await ledger()).toMatchObject([{ outcome: "pending_card_charge" }]);
    });

    it("keeps a dropped pending purchase locked by a paid bill and reports it", async () => {
      feed = [pending("gone")];
      await sync();
      await markPaid((await charges())[0].firstInvoiceMonth);
      feed = [];
      const run = await sync();
      expect(run.summary?.counts).toMatchObject({ cardLocked: 1 });
      expect(await charges()).toHaveLength(1);
    });

    it("keeps a replaced pending purchase locked by a paid bill without duplicating it", async () => {
      feed = [pending("old")];
      await sync();
      await markPaid((await charges())[0].firstInvoiceMonth);
      feed = [record("new", {}, { billId: "bill-2026-04" })];
      const run = await sync();
      expect(run.summary?.counts).toMatchObject({ cardLocked: 1 });
      expect((await charges()).map((charge) => charge.importFingerprint)).toEqual(["pluggy:card:old"]);
    });
  });
});
