import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { investmentHoldings, investmentPortfolio, investmentPositionSnapshots, pluggyAccountLinks, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteInvestment, PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { classifyReserveWithdrawal, reserveAfterWithdrawal, reserveYieldShare } from "@/lib/reserve-withdrawal";
import { createAccount, getAccountDetails } from "@/lib/server/accounts";
import { createInvestmentHolding } from "@/lib/server/investment-portfolio";
import { classifyPendingReserveWithdrawal, listPendingReserveWithdrawals, setBankReserveAmount } from "@/lib/server/investments";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { savePluggyIdentity } from "@/lib/server/pluggy/own-identity";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

const owner = { documentNumber: "12345678909" };
const third = { documentNumber: "98765432100", name: "Banco" };

let database: Database;
let checking: string;
let feed: PluggyRemoteTransaction[];
let positions: PluggyRemoteInvestment[];

const withdrawal = (id: string, amount: number, date = "2026-07-10", overrides: Partial<PluggyRemoteTransaction> = {}): PluggyRemoteTransaction => ({
  id, date: `${date}T15:00:00.000Z`, amount, type: "CREDIT", status: "POSTED", description: "RESGATE CDB", operationType: "RESGATE_APLIC_FINANCEIRA", paymentData: { payer: third, receiver: owner }, ...overrides,
});
const position = (id: string): PluggyRemoteInvestment => ({ id, name: `CDB ${id}`, type: "FIXED_INCOME", subtype: "CDB", balance: 0, date: "2026-07-15T00:00:00.000Z", status: "ACTIVE" });

function api(): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
    listAccounts: vi.fn(async () => [{ id: "remote-a", type: "BANK", name: "A" }]),
    listTransactions: vi.fn(async () => feed),
    listBills: vi.fn(async () => []),
    listInvestments: vi.fn(async () => positions),
  };
}

const sync = (dryRun = false) => runPluggySync({ db: database.db, client: api(), dryRun });
const portfolio = async () => (await database.db.query.investmentPortfolio.findFirst())!;
const imported = async () => (await database.db.query.transactions.findMany()).filter((row) => row.type === "investment_withdrawal");
const balance = async () => (await getAccountDetails(checking, database.db))!.currentBalanceCents;

/** A holding linked to a remote position. Its sync is left out, so the tests set values and snapshots directly. */
async function linkedHolding(externalAssetId: string, currentValueCents: number) {
  const holding = await createInvestmentHolding({ name: externalAssetId, assetClass: "fixed_income", instrumentType: "cdb", currentValueCents, valueAsOf: "2026-07-01" }, database.db);
  await database.db.update(investmentHoldings).set({ externalProvider: "pluggy", externalAssetId }).where(eq(investmentHoldings.id, holding.id));
  return holding.id;
}

const snapshot = (holdingId: string, snapshotDate: string, currentValueCents: number) =>
  database.db.insert(investmentPositionSnapshots).values({ holdingId, snapshotDate, currentValueCents, valuationSource: "manual_balance" });
const setValue = (holdingId: string, currentValueCents: number) =>
  database.db.update(investmentHoldings).set({ currentValueCents }).where(eq(investmentHoldings.id, holdingId));

/** Reserve set on July 1st over the holdings' values at that time. */
async function setReserve(reserveAmountCents: number) {
  vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"));
  await setBankReserveAmount({ reserveAmountCents }, database.db);
  vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
  database = await createTestDatabase();
  checking = (await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 100000 }, database.db)).id;
  const [{ id: itemId }] = await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  await database.db.insert(pluggyAccountLinks).values({ itemId, externalAccountId: "remote-a", accountId: checking, remoteName: "A", kind: "bank", cutoffDate: "2026-01-01" });
  await savePluggyIdentity({ names: ["João da Silva"], cpf: owner.documentNumber, otherOwnAccountId: null }, database.db);
  feed = [];
  positions = [position("cdb-1")];
  pluggyRuntime().syncRunning = false;
});

afterEach(async () => {
  vi.useRealTimers();
  database.db.$client.close();
  await database.cleanup();
});

describe("reserve withdrawal rule", () => {
  it("decides only when one side is empty", () => {
    expect(classifyReserveWithdrawal({ reserveCents: 0, portfolioCents: 5000 })).toBe("portfolio");
    expect(classifyReserveWithdrawal({ reserveCents: 0, portfolioCents: 0 })).toBe("portfolio");
    expect(classifyReserveWithdrawal({ reserveCents: 5000, portfolioCents: 0 })).toBe("reserve");
    expect(classifyReserveWithdrawal({ reserveCents: 5000, portfolioCents: 1 })).toBe("pending");
  });

  it("never takes the reserve below zero, and shares yield by what each side holds", () => {
    expect(reserveAfterWithdrawal(3000, 1000)).toBe(2000);
    expect(reserveAfterWithdrawal(300, 1000)).toBe(0);
    expect(reserveYieldShare(400, 3000, 4000)).toBe(300);
    expect(reserveYieldShare(400, 4000, 4000)).toBe(400);
    expect(reserveYieldShare(400, 5000, 4000)).toBe(400);
    expect([reserveYieldShare(0, 3000, 4000), reserveYieldShare(400, 0, 4000), reserveYieldShare(400, 3000, 0)]).toEqual([0, 0, 0]);
  });
});

describe("imported reserve withdrawals", () => {
  it("takes a withdrawal from a reserve that holds everything, reading the total from before it", async () => {
    const id = await linkedHolding("cdb-1", 300000);
    await setReserve(300000);
    await snapshot(id, "2026-07-05", 300000);
    // The bank lowered the position before the withdrawal reached the statement.
    await setValue(id, 200000);
    feed = [withdrawal("w1", 1000)];
    await sync();
    expect(await imported()).toMatchObject([{ investmentOrigin: "reserve", amountCents: 100000 }]);
    expect(await portfolio()).toMatchObject({ reserveAmountCents: 200000, reserveConfiguredOn: "2026-07-01" });
    await sync();
    expect((await portfolio()).reserveAmountCents).toBe(200000);
    expect(await balance()).toBe(200000);
  });

  it("leaves the reserve alone when everything is portfolio", async () => {
    await linkedHolding("cdb-1", 300000);
    feed = [withdrawal("w1", 1000)];
    await sync();
    expect(await imported()).toMatchObject([{ investmentOrigin: "portfolio" }]);
    expect(await database.db.query.investmentPortfolio.findFirst()).toBeUndefined();
  });

  it("asks the user when both sides hold money, and lowers the reserve only when the user picks it", async () => {
    await linkedHolding("cdb-1", 400000);
    await setReserve(300000);
    feed = [withdrawal("w1", 1000), withdrawal("w2", 500, "2026-07-11")];
    await sync();
    expect((await imported()).map((row) => row.investmentOrigin)).toEqual(["pending", "pending"]);
    expect((await portfolio()).reserveAmountCents).toBe(300000);
    const pending = await listPendingReserveWithdrawals(database.db);
    expect(pending).toMatchObject([{ transactionDate: "2026-07-10", amountCents: 100000, accountName: "Corrente" }, { transactionDate: "2026-07-11", amountCents: 50000 }]);
    await classifyPendingReserveWithdrawal({ transactionId: pending[0].id, origin: "reserve" }, database.db);
    await classifyPendingReserveWithdrawal({ transactionId: pending[1].id, origin: "portfolio" }, database.db);
    expect((await portfolio()).reserveAmountCents).toBe(200000);
    expect(await listPendingReserveWithdrawals(database.db)).toEqual([]);
    await expect(classifyPendingReserveWithdrawal({ transactionId: pending[0].id, origin: "portfolio" }, database.db)).rejects.toMatchObject({ code: "WITHDRAWAL_NOT_PENDING" });
    expect(await balance()).toBe(250000);
  });

  it("empties a reserve smaller than the withdrawal the user gives it", async () => {
    await linkedHolding("cdb-1", 400000);
    await setReserve(30000);
    feed = [withdrawal("w1", 1000)];
    await sync();
    const [pending] = await listPendingReserveWithdrawals(database.db);
    await classifyPendingReserveWithdrawal({ transactionId: pending.id, origin: "reserve" }, database.db);
    expect((await portfolio()).reserveAmountCents).toBe(0);
  });

  it("ignores withdrawals dated before the reserve was set", async () => {
    await linkedHolding("cdb-1", 300000);
    await setReserve(300000);
    feed = [withdrawal("w1", 1000, "2026-06-30")];
    await sync();
    expect(await imported()).toMatchObject([{ investmentOrigin: null }]);
    expect((await portfolio()).reserveAmountCents).toBe(300000);
  });

  it("does not touch the reserve for money kept inside an account without positions", async () => {
    await linkedHolding("cdb-1", 300000);
    await setReserve(300000);
    positions = [];
    feed = [withdrawal("y1", 0.27, "2026-07-10", { description: "Rendimentos", operationType: "TRANSFERENCIA_SALDO_RESERVADO" })];
    await sync();
    expect(await imported()).toMatchObject([{ investmentOrigin: null, amountCents: 27 }]);
    expect((await portfolio()).reserveAmountCents).toBe(300000);
    expect(await balance()).toBe(100027);
  });

  it("waits for a pending row to post before attributing it", async () => {
    await linkedHolding("cdb-1", 300000);
    await setReserve(300000);
    feed = [withdrawal("w1", 1000, "2026-07-10", { status: "PENDING" })];
    await sync();
    expect(await imported()).toMatchObject([{ status: "pending", investmentOrigin: null }]);
    feed = [withdrawal("w1", 1000)];
    await sync();
    expect(await imported()).toMatchObject([{ status: "posted", investmentOrigin: "reserve" }]);
    expect((await portfolio()).reserveAmountCents).toBe(200000);
  });

  it("writes nothing on a dry run", async () => {
    await linkedHolding("cdb-1", 300000);
    await setReserve(300000);
    feed = [withdrawal("w1", 1000)];
    await sync(true);
    expect(await imported()).toEqual([]);
    expect((await portfolio()).reserveAmountCents).toBe(300000);
  });

  it("keeps the configured date when an older row without it is lowered", async () => {
    await linkedHolding("cdb-1", 300000);
    await setReserve(300000);
    await database.db.update(investmentPortfolio).set({ reserveConfiguredOn: null, updatedAt: new Date("2026-07-02T12:00:00.000Z") });
    feed = [withdrawal("w0", 100, "2026-07-01"), withdrawal("w1", 1000)];
    await sync();
    expect((await imported()).map((row) => row.investmentOrigin)).toEqual([null, "reserve"]);
    expect(await portfolio()).toMatchObject({ reserveAmountCents: 200000, reserveConfiguredOn: "2026-07-02" });
  });
});
