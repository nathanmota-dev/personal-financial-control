import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { categories, pluggyAccountLinks, pluggyImportLedger, pluggyItems, transactions } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { createAccount, getAccountDetails } from "@/lib/server/accounts";
import { getMonthlyDashboard } from "@/lib/server/dashboard";
import { getReport } from "@/lib/server/reports";
import { createInvestmentHolding, getInvestmentPortfolioDashboard } from "@/lib/server/investment-portfolio";
import { configureInvestmentPortfolio } from "@/lib/server/investments";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { savePluggyIdentity } from "@/lib/server/pluggy/own-identity";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { updateTransaction } from "@/lib/server/transactions";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;
type Feed = Record<string, PluggyRemoteTransaction[]>;

const CPF = "12345678909";
const owner = { documentNumber: CPF };
const ownParties = { payer: owner, receiver: owner };
const third = { documentNumber: "98765432100", name: "Outra Pessoa" };

let database: Database;
let checking: string;
let savings: string;
let parking: string;
let feed: Feed;
let itemId: string;

const tx = (id: string, overrides: Partial<PluggyRemoteTransaction> = {}): PluggyRemoteTransaction => ({ id, date: "2026-03-10T15:00:00.000Z", amount: -100, type: "DEBIT", status: "POSTED", description: "Mercado", operationType: "OUTROS", paymentData: { payer: owner, receiver: third }, ...overrides });
const ownDebit = (id: string, overrides = {}) => tx(id, { description: "PIX ENVIADO", operationType: "PIX", paymentData: ownParties, ...overrides });
const ownCredit = (id: string, overrides = {}) => tx(id, { type: "CREDIT", amount: 100, description: "PIX RECEBIDO", operationType: "PIX", paymentData: ownParties, ...overrides });

function api(): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
    listAccounts: vi.fn(async () => [{ id: "remote-a", type: "BANK", name: "A" }, { id: "remote-b", type: "BANK", name: "B" }, { id: "remote-card", type: "CREDIT", name: "C" }]),
    listTransactions: vi.fn(async (id: string) => feed[id] ?? []),
    listBills: vi.fn(async () => []),
    listInvestments: vi.fn(async () => []),
  };
}

const sync = (dryRun = false) => runPluggySync({ db: database.db, client: api(), dryRun });
const rows = () => database.db.query.transactions.findMany();
const transferRows = () => database.db.query.transfers.findMany();
const ledger = () => database.db.query.pluggyImportLedger.findMany();

async function link(external: string, accountId: string, cutoffDate = "2026-01-01", kind: "bank" | "credit" = "bank") {
  await database.db.insert(pluggyAccountLinks).values({ itemId, externalAccountId: external, accountId, remoteName: external, kind, cutoffDate });
}

const setIdentity = (otherOwnAccountId: string | null = null) => savePluggyIdentity({ names: ["João da Silva"], cpf: CPF, otherOwnAccountId }, database.db);

beforeEach(async () => {
  database = await createTestDatabase();
  checking = (await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 100000 }, database.db)).id;
  savings = (await createAccount({ name: "Poupança", type: "savings", initialBalanceCents: 0 }, database.db)).id;
  parking = (await createAccount({ name: "Outras", type: "checking", initialBalanceCents: 0 }, database.db)).id;
  feed = {};
  pluggyRuntime().syncRunning = false;
  [{ id: itemId }] = await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  await link("remote-a", checking);
  await setIdentity();
});

afterEach(async () => {
  database.db.$client.close();
  await database.cleanup();
});

describe("bank transaction import", () => {
  it("creates ordinary rows and reports counts per classification", async () => {
    feed["remote-a"] = [tx("t1"), tx("t2", { type: "CREDIT", amount: 250.5, description: "Salário" })];
    const run = await sync();
    expect(run.summary?.counts).toMatchObject({ bankOrdinary: 2 });
    expect((await rows()).map((row) => [row.type, row.status, row.amountCents, row.categoryId, row.importFingerprint]).sort()).toEqual([
      ["expense", "posted", 10000, null, "pluggy:bank:t1"],
      ["income", "posted", 25050, null, "pluggy:bank:t2"],
    ]);
    expect(await ledger()).toHaveLength(2);
  });

  it("creates nothing more on a second sync", async () => {
    feed["remote-a"] = [tx("t1"), ownDebit("t2", { amount: -30 }), tx("t3", { description: "PAGAMENTO FATURA" })];
    await setIdentity(parking);
    await sync();
    const [firstRows, firstTransfers, firstLedger] = [await rows(), await transferRows(), await ledger()];
    const run = await sync();
    expect(run.status).toBe("success");
    expect(run.summary?.counts).not.toHaveProperty("bankOrdinary");
    expect(await rows()).toHaveLength(firstRows.length);
    expect(await transferRows()).toHaveLength(firstTransfers.length);
    expect(await ledger()).toHaveLength(firstLedger.length);
  });

  it("computes a dry run without writing and with the same counts", async () => {
    await link("remote-b", savings);
    feed["remote-a"] = [tx("t1"), ownDebit("a1")];
    feed["remote-b"] = [ownCredit("b1")];
    const run = await sync(true);
    expect(run.summary?.counts).toMatchObject({ bankOrdinary: 1, bankOwnTransfer: 1 });
    expect(await rows()).toHaveLength(0);
    expect(await transferRows()).toHaveLength(0);
    expect(await ledger()).toHaveLength(0);
  });

  it("ignores records before the cutoff, reading the day in São Paulo", async () => {
    await database.db.delete(pluggyAccountLinks);
    await link("remote-a", checking, "2026-03-11");
    feed["remote-a"] = [tx("before", { date: "2026-03-11T02:59:59.999Z" }), tx("after", { date: "2026-03-11T03:00:00.000Z" })];
    const run = await sync();
    expect(run.summary?.counts).toMatchObject({ bankOrdinary: 1, bankIgnored: 1 });
    expect((await rows()).map((row) => row.importFingerprint)).toEqual(["pluggy:bank:after"]);
  });

  it("does not import card accounts", async () => {
    await link("remote-card", checking, "2026-01-01", "credit");
    feed["remote-card"] = [tx("card-1")];
    await sync();
    expect(await rows()).toHaveLength(0);
  });

  it("ignores records that cannot be mapped", async () => {
    feed["remote-a"] = [tx("zero", { amount: 0 }), tx("odd", { type: "OTHER" })];
    expect((await sync()).summary?.counts).toMatchObject({ bankIgnored: 2 });
    expect(await rows()).toHaveLength(0);
  });

  it("isolates a failing account", async () => {
    await link("remote-b", savings);
    feed["remote-a"] = [tx("t1")];
    const client = api();
    vi.mocked(client.listTransactions).mockImplementation(async (id) => { if (id === "remote-b") throw new Error("down"); return feed[id] ?? []; });
    const run = await runPluggySync({ db: database.db, client });
    expect(run).toMatchObject({ status: "partial", summary: { accounts: { failed: 1 }, counts: { bankOrdinary: 1 } } });
  });
});

describe("own transfers", () => {
  beforeEach(async () => { await link("remote-b", savings); });

  it("creates one transfer for two linked accounts and no income or expense", async () => {
    feed["remote-a"] = [ownDebit("a1")];
    feed["remote-b"] = [ownCredit("b1", { date: "2026-03-11T15:00:00.000Z" })];
    const run = await sync();
    expect(run.summary?.counts).toMatchObject({ bankOwnTransfer: 1 });
    expect(await rows()).toHaveLength(0);
    expect(await transferRows()).toMatchObject([{ fromAccountId: checking, toAccountId: savings, amountCents: 10000, transferDate: "2026-03-10", description: "PIX ENVIADO" }]);
    expect(await ledger()).toEqual(expect.arrayContaining([expect.objectContaining({ fingerprint: "pluggy:bank:a1", outcome: "created", localTable: "transfers" }), expect.objectContaining({ fingerprint: "pluggy:bank:b1", outcome: "matched", localTable: "transfers" })]));
    await sync();
    expect(await transferRows()).toHaveLength(1);
  });

  it("uses the debit side when the credit side is processed first", async () => {
    feed["remote-a"] = [ownCredit("a1")];
    feed["remote-b"] = [ownDebit("b1")];
    await sync();
    expect(await transferRows()).toMatchObject([{ fromAccountId: savings, toAccountId: checking, description: "PIX ENVIADO" }]);
  });

  it("pairs repeated equal transfers one to one", async () => {
    feed["remote-a"] = [ownDebit("a1"), ownDebit("a2")];
    feed["remote-b"] = [ownCredit("b1"), ownCredit("b2")];
    await sync();
    expect(await transferRows()).toHaveLength(2);
    expect(await ledger()).toHaveLength(4);
  });

  it("does not pair amounts or dates outside the window", async () => {
    await setIdentity(parking);
    feed["remote-a"] = [ownDebit("a1"), ownDebit("a2", { date: "2026-03-20T15:00:00.000Z", amount: -40 })];
    feed["remote-b"] = [ownCredit("b1", { date: "2026-03-12T15:00:00.000Z" }), ownCredit("b2", { date: "2026-03-20T15:00:00.000Z", amount: 41 })];
    await sync();
    expect(await transferRows()).toHaveLength(4);
  });

  it("sends an unlinked destination to the other own accounts and keeps the balance right", async () => {
    await database.db.delete(pluggyAccountLinks);
    await link("remote-a", checking);
    await setIdentity(parking);
    feed["remote-a"] = [ownDebit("a1"), ownCredit("a2", { amount: 25 })];
    await sync();
    expect(await rows()).toHaveLength(0);
    expect(await transferRows()).toEqual(expect.arrayContaining([expect.objectContaining({ fromAccountId: checking, toAccountId: parking, amountCents: 10000 }), expect.objectContaining({ fromAccountId: parking, toAccountId: checking, amountCents: 2500 })]));
    expect((await getAccountDetails(checking, database.db)).currentBalanceCents).toBe(100000 - 10000 + 2500);
    expect((await getMonthlyDashboard("2026-03", database.db)).totals.incomeCents).toBe(0);
  });

  it("asks for attention and records nothing without a destination, then imports once configured", async () => {
    await database.db.delete(pluggyAccountLinks);
    await link("remote-a", checking);
    feed["remote-a"] = [ownDebit("a1")];
    const run = await sync();
    expect(run.summary?.attention).toMatchObject([{ reason: "missing_other_own_account", accountLabel: "remote-a", amountCents: 10000, date: "2026-03-10" }]);
    expect(await ledger()).toHaveLength(0);
    await setIdentity(parking);
    await sync();
    expect(await transferRows()).toHaveLength(1);
  });

  it("does not use the destination account as its own counterpart", async () => {
    await setIdentity(checking);
    await database.db.delete(pluggyAccountLinks);
    await link("remote-a", checking);
    feed["remote-a"] = [ownDebit("a1")];
    expect((await sync()).summary?.attention).toMatchObject([{ reason: "missing_other_own_account" }]);
  });

  it("repoints a parked transfer when the other side arrives in a later run", async () => {
    await setIdentity(parking);
    feed["remote-a"] = [ownDebit("a1")];
    await sync();
    expect(await transferRows()).toMatchObject([{ toAccountId: parking }]);
    feed["remote-b"] = [ownCredit("b1")];
    await sync();
    expect(await transferRows()).toMatchObject([{ fromAccountId: checking, toAccountId: savings }]);
    expect((await getAccountDetails(parking, database.db)).currentBalanceCents).toBe(0);
    await sync();
    expect(await transferRows()).toHaveLength(1);
  });

  it("repoints the origin when the debit side arrives later", async () => {
    await setIdentity(parking);
    feed["remote-a"] = [ownCredit("a1")];
    await sync();
    expect(await transferRows()).toMatchObject([{ fromAccountId: parking, toAccountId: checking }]);
    feed["remote-b"] = [ownDebit("b1")];
    await sync();
    expect(await transferRows()).toMatchObject([{ fromAccountId: savings, toAccountId: checking }]);
  });

  it("pairs sides from different runs when no destination was configured", async () => {
    feed["remote-a"] = [ownDebit("a1")];
    await sync();
    expect(await transferRows()).toHaveLength(0);
    feed["remote-b"] = [ownCredit("b1")];
    await sync();
    expect(await transferRows()).toHaveLength(1);
  });

  it("waits for a pending own transfer to post", async () => {
    feed["remote-a"] = [ownDebit("a1", { status: "PENDING" })];
    expect((await sync()).summary?.counts).toMatchObject({ bankDeferred: 1 });
    expect(await ledger()).toHaveLength(0);
  });

  it("falls through to the catch-all when the other account cannot be read", async () => {
    await setIdentity(parking);
    feed["remote-a"] = [ownDebit("a1")];
    const client = api();
    vi.mocked(client.listTransactions).mockImplementation(async (id) => { if (id === "remote-b") throw new Error("down"); return feed[id] ?? []; });
    await runPluggySync({ db: database.db, client });
    expect(await transferRows()).toMatchObject([{ toAccountId: parking }]);
  });

  it("does not treat a third party with a partially matching name as own", async () => {
    await database.db.delete(pluggyAccountLinks);
    await link("remote-a", checking);
    await savePluggyIdentity({ names: ["João da Silva"], otherOwnAccountId: null }, database.db);
    const partial = { name: "João da Silva Santos" };
    feed["remote-a"] = [tx("a1", { description: "TED", paymentData: { payer: { name: "João da Silva" }, receiver: partial } })];
    const run = await sync();
    expect(await transferRows()).toHaveLength(0);
    expect(await rows()).toMatchObject([{ type: "expense" }]);
    expect(run.summary?.attention).toEqual([]);
  });

  it("imports a possible own transfer as ordinary and lists it for review", async () => {
    feed["remote-a"] = [tx("a1", { description: "TED", paymentData: { payer: null, receiver: owner } })];
    expect((await sync()).summary).toMatchObject({ counts: { bankOrdinary: 1 }, attention: [{ reason: "possible_own_transfer", description: "TED" }] });
  });
});

describe("card payments", () => {
  it("records only the ledger outcome", async () => {
    feed["remote-a"] = [tx("p1", { description: "PAGAMENTO EFETUADO FATURA" })];
    expect((await sync()).summary?.counts).toMatchObject({ bankCardPayment: 1 });
    expect(await rows()).toHaveLength(0);
    expect(await ledger()).toMatchObject([{ fingerprint: "pluggy:bank:p1", outcome: "pending_card_payment", localTable: null, localId: null }]);
  });

  it("waits for a pending payment to post", async () => {
    feed["remote-a"] = [tx("p1", { description: "PAGAMENTO FATURA", status: "PENDING" })];
    expect((await sync()).summary?.counts).toMatchObject({ bankDeferred: 1 });
    expect(await ledger()).toHaveLength(0);
  });
});

describe("investment movements", () => {
  const withdrawal = (id = "w1", overrides = {}) => tx(id, { type: "CREDIT", amount: 200, description: "RESGATE CDB", date: "2026-07-10T15:00:00.000Z", ...overrides });

  async function setupHolding() {
    await configureInvestmentPortfolio({ checkpointBalanceCents: 100000, expectedMonthlyRateBps: 0, checkpointDate: "2026-07-01" }, database.db);
    await createInvestmentHolding({ name: "CDB", assetClass: "fixed_income", instrumentType: "cdb", currentValueCents: 100000, valueAsOf: "2026-07-01" }, database.db);
  }
  const holdingValue = async () => (await getInvestmentPortfolioDashboard(database.db)).holdings[0]?.currentValueCents;
  const reductionEvents = () => database.db.query.investmentReductionEvents.findMany();

  it("creates contributions and withdrawals in the default investment category", async () => {
    feed["remote-a"] = [tx("c1", { description: "APLICACAO CDB" }), withdrawal()];
    expect((await sync()).summary?.counts).toMatchObject({ bankInvestmentContribution: 1, bankInvestmentWithdrawal: 1 });
    const investment = await database.db.query.categories.findFirst({ where: (table, { eq }) => eq(table.name, "Investimentos") });
    expect((await rows()).map((row) => [row.type, row.categoryId]).sort()).toEqual([["investment_contribution", investment?.id], ["investment_withdrawal", investment?.id]]);
  });

  it("uses another investment category when the default one is archived", async () => {
    const { eq } = await import("drizzle-orm");
    await database.db.update(categories).set({ isArchived: true }).where(eq(categories.name, "Investimentos"));
    const [custom] = await database.db.insert(categories).values({ name: "Renda fixa", group: "investment" }).returning();
    feed["remote-a"] = [withdrawal()];
    await sync();
    expect(await rows()).toMatchObject([{ categoryId: custom.id }]);
  });

  it("flags the movement when no investment category exists", async () => {
    const { eq } = await import("drizzle-orm");
    await database.db.update(categories).set({ isArchived: true }).where(eq(categories.group, "investment"));
    feed["remote-a"] = [withdrawal()];
    expect((await sync()).summary?.attention).toMatchObject([{ reason: "missing_investment_category" }]);
    expect(await rows()).toHaveLength(0);
    expect(await ledger()).toHaveLength(0);
  });

  it("leaves holdings and reduction events unchanged on import", async () => {
    await setupHolding();
    feed["remote-a"] = [withdrawal()];
    expect((await sync()).status).toBe("success");
    expect(await rows()).toMatchObject([{ type: "investment_withdrawal", status: "posted", isIncludedInInvestmentCheckpoint: true }]);
    expect(await holdingValue()).toBe(100000);
    expect(await reductionEvents()).toHaveLength(0);
  });

  it("keeps holdings unchanged when a pending withdrawal posts and when the user edits it", async () => {
    await setupHolding();
    feed["remote-a"] = [withdrawal("w1", { status: "PENDING" })];
    await sync();
    feed["remote-a"] = [withdrawal("w1")];
    await sync();
    const [row] = await rows();
    expect(row.status).toBe("posted");
    await updateTransaction({ id: row.id, notes: "Editado" }, database.db);
    expect(await holdingValue()).toBe(100000);
    expect(await reductionEvents()).toHaveLength(0);
    expect((await rows())[0].isIncludedInInvestmentCheckpoint).toBe(true);
  });
});

describe("re-sync rules", () => {
  it("updates bank-owned state on a pending row and keeps the same local row", async () => {
    feed["remote-a"] = [tx("t1", { status: "PENDING" })];
    await sync();
    const [before] = await rows();
    feed["remote-a"] = [tx("t1", { amount: -120, date: "2026-03-12T15:00:00.000Z" })];
    expect((await sync()).summary?.counts).toMatchObject({ bankUpdated: 1 });
    expect(await rows()).toMatchObject([{ id: before.id, status: "posted", amountCents: 12000, transactionDate: "2026-03-12", competenceMonth: "2026-03" }]);
  });

  it("does not change a row that already posted", async () => {
    feed["remote-a"] = [tx("t1")];
    await sync();
    feed["remote-a"] = [tx("t1", { amount: -999, status: "PENDING" })];
    const run = await sync();
    expect(run.summary?.counts).not.toHaveProperty("bankUpdated");
    expect(await rows()).toMatchObject([{ status: "posted", amountCents: 10000 }]);
  });

  it("keeps user edits on a later sync without an idempotency conflict", async () => {
    feed["remote-a"] = [tx("t1", { status: "PENDING" })];
    await sync();
    const [row] = await rows();
    const food = await database.db.query.categories.findFirst({ where: (table, { eq }) => eq(table.name, "Alimentação") });
    await updateTransaction({ id: row.id, status: "pending", categoryId: food!.id, notes: "Feira", description: "Feira do mês", competenceMonth: "2026-04" }, database.db);
    feed["remote-a"] = [tx("t1", { description: "Mudou no banco", date: "2026-03-12T15:00:00.000Z" })];
    expect((await sync()).status).toBe("success");
    expect(await rows()).toMatchObject([{ categoryId: food!.id, notes: "Feira", description: "Feira do mês", competenceMonth: "2026-04", transactionDate: "2026-03-12", status: "posted" }]);
  });

  it("moves the fingerprint when a pending row posts under a new id", async () => {
    feed["remote-a"] = [tx("old", { status: "PENDING" })];
    await sync();
    const [before] = await rows();
    feed["remote-a"] = [tx("new", { date: "2026-03-11T15:00:00.000Z" })];
    const run = await sync();
    expect(run.summary?.counts).toMatchObject({ bankUpdated: 1 });
    expect(run.summary?.counts).not.toHaveProperty("bankOrdinary");
    expect(await rows()).toMatchObject([{ id: before.id, status: "posted", importFingerprint: "pluggy:bank:new", transactionDate: "2026-03-11" }]);
    expect(await ledger()).toMatchObject([{ fingerprint: "pluggy:bank:new", localId: before.id, outcome: "created" }]);
    await sync();
    expect(await rows()).toHaveLength(1);
  });

  it("does not adopt a pending row that is still returned or falls outside the window", async () => {
    feed["remote-a"] = [tx("still", { status: "PENDING" }), tx("far", { status: "PENDING", date: "2026-02-01T15:00:00.000Z" })];
    await sync();
    feed["remote-a"] = [tx("still", { status: "PENDING" }), tx("new")];
    await sync();
    expect((await rows()).map((row) => row.importFingerprint).sort()).toEqual(["pluggy:bank:far", "pluggy:bank:new", "pluggy:bank:still"]);
  });

  it("cancels a pending row that disappears and restores it on reappearance", async () => {
    feed["remote-a"] = [tx("t1", { status: "PENDING" })];
    await sync();
    feed["remote-a"] = [];
    expect((await sync()).summary?.counts).toMatchObject({ bankCancelled: 1 });
    expect(await rows()).toMatchObject([{ status: "cancelled" }]);
    expect(await ledger()).toMatchObject([{ outcome: "cancelled" }]);
    await sync();
    expect((await rows())[0].status).toBe("cancelled");
    feed["remote-a"] = [tx("t1", { status: "PENDING", amount: -80 })];
    expect((await sync()).summary?.counts).toMatchObject({ bankRestored: 1 });
    expect(await rows()).toMatchObject([{ status: "pending", amountCents: 8000 }]);
    expect(await ledger()).toMatchObject([{ outcome: "created" }]);
  });

  it("adopts a row the sync cancelled when it returns posted under a new id", async () => {
    feed["remote-a"] = [tx("old", { status: "PENDING" })];
    await sync();
    feed["remote-a"] = [];
    await sync();
    feed["remote-a"] = [tx("new")];
    await sync();
    expect(await rows()).toMatchObject([{ status: "posted", importFingerprint: "pluggy:bank:new" }]);
  });

  it("does not revive a row the user cancelled", async () => {
    feed["remote-a"] = [tx("t1")];
    await sync();
    const [row] = await rows();
    await updateTransaction({ id: row.id, status: "cancelled" }, database.db);
    await sync();
    expect((await rows())[0].status).toBe("cancelled");
  });

  it("does not cancel rows before the cutoff or recreate rows deleted by the user", async () => {
    feed["remote-a"] = [tx("t1", { status: "PENDING", date: "2026-02-01T15:00:00.000Z" }), tx("t2")];
    await sync();
    const { eq } = await import("drizzle-orm");
    await database.db.update(pluggyAccountLinks).set({ cutoffDate: "2026-03-01" }).where(eq(pluggyAccountLinks.externalAccountId, "remote-a"));
    feed["remote-a"] = [tx("t2")];
    await database.db.delete(transactions).where(eq(transactions.importFingerprint, "pluggy:bank:t2"));
    const run = await sync();
    expect(run.summary?.counts).not.toHaveProperty("bankCancelled");
    expect(run.summary?.counts).not.toHaveProperty("bankOrdinary");
    expect(await rows()).toMatchObject([{ importFingerprint: "pluggy:bank:t1", status: "pending" }]);
  });

  it("stamps lastSeenAt on records seen again", async () => {
    feed["remote-a"] = [tx("t1")];
    await sync();
    const { eq } = await import("drizzle-orm");
    await database.db.update(pluggyImportLedger).set({ lastSeenAt: new Date("2020-01-01T00:00:00Z") }).where(eq(pluggyImportLedger.fingerprint, "pluggy:bank:t1"));
    await sync();
    expect((await ledger())[0].lastSeenAt.getFullYear()).toBeGreaterThan(2020);
  });
});

describe("totals", () => {
  it("exclude own transfers and pending card payments from the dashboard and reports", async () => {
    await link("remote-b", savings);
    feed["remote-a"] = [tx("t1", { amount: -50 }), ownDebit("a1", { amount: -300 }), tx("p1", { amount: -700, description: "PAGAMENTO FATURA" })];
    feed["remote-b"] = [tx("t2", { type: "CREDIT", amount: 900, description: "Salário" }), ownCredit("b1", { amount: 300 })];
    await sync();
    const dashboard = await getMonthlyDashboard("2026-03", database.db);
    expect(dashboard.totals).toMatchObject({ incomeCents: 90000, uncategorizedExpenseCents: 5000 });
    const report = await getReport({ mode: "monthly", period: "2026-03" }, database.db, "2026-03-31");
    expect(report.totals).toMatchObject({ incomeCents: 90000, expenseCents: 5000 });
    expect((await getAccountDetails(checking, database.db)).currentBalanceCents).toBe(100000 - 5000 - 30000);
    expect((await getAccountDetails(savings, database.db)).currentBalanceCents).toBe(90000 + 30000);
  });
});
