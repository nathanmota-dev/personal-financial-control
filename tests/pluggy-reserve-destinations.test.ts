import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { investmentHoldings, pluggyAccountLinks, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteInvestment, PluggyRemoteTransaction } from "@/lib/interfaces/pluggy";
import { effectiveReserveShare, keptReserveShare, reserveAfterShareChange, yieldWithoutContributions } from "@/lib/reserve-destination";
import { createAccount, getAccountDetails } from "@/lib/server/accounts";
import { getInvestmentOverview } from "@/lib/server/investment-operations";
import { createInvestmentHolding, createInvestmentPurpose, listStalePositions, retireStalePosition, upsertInvestmentPurposeAllocation } from "@/lib/server/investment-portfolio";
import { classifyReserveDestination, listReserveDestinations, setBankReserveAmount } from "@/lib/server/investments";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { savePluggyIdentity } from "@/lib/server/pluggy/own-identity";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { deleteTransaction, updateTransaction } from "@/lib/server/transactions";
import { reserveDestinationShortcuts } from "@/lib/utils/components/reserve-destination";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

const owner = { documentNumber: "12345678909" };
const third = { documentNumber: "98765432100", name: "Banco" };

let database: Database;
let checking: string;
let feed: PluggyRemoteTransaction[];
let positions: PluggyRemoteInvestment[];

const contribution = (id: string, amount: number, date = "2026-07-10", overrides: Partial<PluggyRemoteTransaction> = {}): PluggyRemoteTransaction => ({
  id, date: `${date}T15:00:00.000Z`, amount: -amount, type: "DEBIT", status: "POSTED", description: "APLICACAO CDB", operationType: "OUTROS", paymentData: { payer: owner, receiver: third }, ...overrides,
});
const position = (id: string, balance: number): PluggyRemoteInvestment => ({ id, name: `CDB ${id}`, type: "FIXED_INCOME", subtype: "CDB", balance, amount: balance, date: "2026-07-15T00:00:00.000Z", status: "ACTIVE" });

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
const reserve = async () => (await database.db.query.investmentPortfolio.findFirst())?.reserveAmountCents;
const imported = async () => (await database.db.query.transactions.findMany()).filter((row) => row.type === "investment_contribution");
const balance = async () => (await getAccountDetails(checking, database.db))!.currentBalanceCents;
const classify = (transactionId: string, reserveCents: number) => classifyReserveDestination({ transactionId, reserveCents }, database.db);

/** A holding linked to a remote position, `cdb-1` unless named, valued on July 1st unless dated. */
async function linkedHolding(currentValueCents: number, externalAssetId = "cdb-1", valueAsOf = "2026-07-01") {
  const holding = await createInvestmentHolding({ name: externalAssetId, assetClass: "fixed_income", instrumentType: "cdb", currentValueCents, valueAsOf }, database.db);
  await database.db.update(investmentHoldings).set({ externalProvider: "pluggy", externalAssetId }).where(eq(investmentHoldings.id, holding.id));
  return holding.id;
}

const holdingsByAsset = async () => new Map((await database.db.query.investmentHoldings.findMany()).map((row) => [row.externalAssetId, row]));

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
  checking = (await createAccount({ name: "Corrente", type: "checking", initialBalanceCents: 500000 }, database.db)).id;
  const [{ id: itemId }] = await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  await database.db.insert(pluggyAccountLinks).values({ itemId, externalAccountId: "remote-a", accountId: checking, remoteName: "A", kind: "bank", cutoffDate: "2026-01-01" });
  await savePluggyIdentity({ names: ["João da Silva"], cpf: owner.documentNumber, otherOwnAccountId: null }, database.db);
  feed = [];
  positions = [position("cdb-1", 4000)];
  pluggyRuntime().syncRunning = false;
});

afterEach(async () => {
  vi.useRealTimers();
  database.db.$client.close();
  await database.cleanup();
});

describe("reserve destination rule", () => {
  const row = { type: "investment_contribution", status: "posted", amountCents: 1000, transactionDate: "2026-06-20", reserveShareCents: 600, reserveClassifiedOn: "2026-07-10" };

  it("counts a posted contribution's share until a reserve typed later includes it", () => {
    expect(effectiveReserveShare(row, "2026-07-01")).toBe(600);
    expect(effectiveReserveShare(row, "2026-07-10")).toBe(600);
    expect(effectiveReserveShare(row, "2026-07-11")).toBe(0);
    expect(effectiveReserveShare(row, null)).toBe(0);
    expect(effectiveReserveShare({ ...row, reserveClassifiedOn: null }, "2026-07-01")).toBe(0);
    expect(effectiveReserveShare(null, "2026-07-01")).toBe(0);
    expect(effectiveReserveShare({ ...row, reserveShareCents: null }, "2026-07-01")).toBe(0);
    expect(effectiveReserveShare({ ...row, status: "cancelled" }, "2026-07-01")).toBe(0);
    expect(effectiveReserveShare({ ...row, type: "expense" }, "2026-07-01")).toBe(0);
    expect(effectiveReserveShare({ ...row, reserveShareCents: 5000 }, "2026-07-01")).toBe(1000);
  });

  it("keeps the reserve at zero or more and follows a lower amount", () => {
    expect(reserveAfterShareChange(3000, 500)).toBe(3500);
    expect(reserveAfterShareChange(300, -1000)).toBe(0);
    expect(keptReserveShare(600, { type: "investment_contribution", status: "posted", amountCents: 400 })).toBe(400);
    expect(keptReserveShare(600, { type: "investment_contribution", status: "posted", amountCents: 2000 })).toBe(600);
    expect(keptReserveShare(600, { type: "expense", status: "posted", amountCents: 2000 })).toBeNull();
    expect(keptReserveShare(null, { type: "investment_contribution", status: "posted", amountCents: 2000 })).toBeNull();
  });

  it("takes from the yield only the contributions that no new position explains", () => {
    expect(yieldWithoutContributions(1000, 500, 0)).toBe(500);
    expect(yieldWithoutContributions(1000, 500, 600)).toBe(1000);
    expect(yieldWithoutContributions(100, 500, 0)).toBe(-400);
  });

  it("offers all, half or none of the contribution", () => {
    expect(reserveDestinationShortcuts(1001)).toEqual([
      { label: "Tudo reserva", cents: 1001 },
      { label: "Metade", cents: 500 },
      { label: "Tudo investimentos", cents: 0 },
    ]);
  });
});

describe("imported contribution destinations", () => {
  it("asks for the destination of a contribution and moves the reserve by each change", async () => {
    await linkedHolding(400000);
    await setReserve(100000);
    feed = [contribution("c1", 1000)];
    await sync();
    const [row] = await imported();
    expect(row).toMatchObject({ investmentOrigin: "pending", reserveShareCents: null, amountCents: 100000 });
    const listed = await listReserveDestinations(database.db);
    expect(listed).toEqual([{ id: row.id, transactionDate: "2026-07-10", description: "APLICACAO CDB", amountCents: 100000, accountName: "Corrente", reserveShareCents: null, pending: true, beforeReserve: false }]);
    expect((await getInvestmentOverview(database.db)).reserveDestinations).toEqual(listed);

    await classify(row.id, 60000);
    expect(await reserve()).toBe(160000);
    expect(await listReserveDestinations(database.db)).toMatchObject([{ id: row.id, reserveShareCents: 60000, pending: false }]);
    await classify(row.id, 100000);
    expect(await reserve()).toBe(200000);
    await classify(row.id, 0);
    expect(await reserve()).toBe(100000);
    expect(await balance()).toBe(400000);
  });

  it("refuses a share above the contribution or a reserve above the invested total", async () => {
    await linkedHolding(400000);
    await setReserve(350000);
    feed = [contribution("c1", 1000)];
    await sync();
    const [row] = await imported();
    await expect(classify(row.id, 100001)).rejects.toMatchObject({ code: "RESERVE_SHARE_ABOVE_AMOUNT" });
    await expect(classify(row.id, 60000)).rejects.toMatchObject({ code: "RESERVE_DESTINATION_ABOVE_TOTAL" });
    await classify(row.id, 50000);
    expect(await reserve()).toBe(400000);
  });

  it("does not ask before the reserve exists or for contributions it already includes", async () => {
    await linkedHolding(400000);
    feed = [contribution("c0", 500, "2026-06-30"), contribution("c1", 1000)];
    await sync();
    expect((await imported()).map((row) => row.investmentOrigin)).toEqual([null, null]);
    expect(await listReserveDestinations(database.db)).toEqual([]);
    await setReserve(100000);
    // The next sync asks about the contribution made after the reserve was set, and only that one.
    await sync();
    const rows = await imported();
    expect(rows.map((row) => row.investmentOrigin)).toEqual([null, "pending"]);
    await expect(classify(rows[0].id, 100)).rejects.toMatchObject({ code: "CONTRIBUTION_BEFORE_RESERVE" });
  });

  it("waits for a pending row to post and ignores connections without followed positions", async () => {
    await linkedHolding(400000);
    await setReserve(100000);
    feed = [contribution("c1", 1000, "2026-07-10", { status: "PENDING" })];
    await sync();
    expect(await imported()).toMatchObject([{ status: "pending", investmentOrigin: null }]);
    feed = [contribution("c1", 1000)];
    await sync();
    expect(await imported()).toMatchObject([{ status: "posted", investmentOrigin: "pending" }]);
    positions = [];
    feed = [contribution("c1", 1000), contribution("c2", 300, "2026-07-11", { description: "Aplicação cofrinho", operationType: "TRANSFERENCIA_SALDO_RESERVADO" })];
    await sync();
    expect((await imported()).map((row) => row.investmentOrigin)).toEqual(["pending", null]);
  });

  it("writes nothing on a dry run", async () => {
    await linkedHolding(400000);
    await setReserve(100000);
    feed = [contribution("c1", 1000)];
    await sync(true);
    expect(await imported()).toEqual([]);
  });

  it("follows edits and deletions of a classified contribution", async () => {
    await linkedHolding(400000);
    await setReserve(100000);
    feed = [contribution("c1", 1000), contribution("c2", 800, "2026-07-11")];
    await sync();
    const [first, second] = await imported();
    await classify(first.id, 60000);
    await classify(second.id, 80000);
    expect(await reserve()).toBe(240000);

    await updateTransaction({ id: first.id, amountCents: 40000 }, database.db);
    expect((await imported())[0].reserveShareCents).toBe(40000);
    expect(await reserve()).toBe(220000);
    await deleteTransaction(second.id, database.db);
    expect(await reserve()).toBe(140000);
  });

  it("lets a reserve typed later include the classified shares and the pending contributions", async () => {
    await linkedHolding(400000);
    await setReserve(100000);
    feed = [contribution("c1", 1000), contribution("c2", 800, "2026-07-11")];
    await sync();
    const [first, second] = await imported();
    await classify(first.id, 60000);
    vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
    await setBankReserveAmount({ reserveAmountCents: 200000 }, database.db);
    expect(await listReserveDestinations(database.db)).toEqual([]);
    expect((await imported()).map((row) => row.investmentOrigin)).toEqual([null, null]);
    await deleteTransaction(first.id, database.db);
    expect(await reserve()).toBe(200000);
    await expect(classify(second.id, 100)).rejects.toMatchObject({ code: "CONTRIBUTION_BEFORE_RESERVE" });
  });

  it("does not give the reserve a share of money that was a contribution, only of the real yield", async () => {
    await linkedHolding(400000);
    await setReserve(200000);
    feed = [contribution("c1", 1000)];
    positions = [position("cdb-1", 5000)];
    await sync();
    expect(await reserve()).toBe(200000);
    const [row] = await imported();
    await classify(row.id, 100000);
    expect(await reserve()).toBe(300000);
    // The position grew R$ 50 more: 300000 of 500000 is reserve, so it takes 60% of the yield.
    positions = [position("cdb-1", 5050)];
    await sync();
    expect(await reserve()).toBe(303000);
  });
});

describe("new and stale bank positions", () => {
  it("links a new position of a followed connection and asks about the contribution the reserve did not see", async () => {
    await linkedHolding(400000);
    await setReserve(100000);
    // The bank recorded the movement before the reserve was typed, and reported the position only now.
    feed = [contribution("c0", 1000, "2026-06-28"), contribution("old", 500, "2026-06-20")];
    positions = [position("cdb-1", 4000), position("cdb-2", 1000.5)];
    const result = await sync();
    expect(result.summary?.counts).toMatchObject({ investmentsAutoLinked: 1 });
    expect((await holdingsByAsset()).get("cdb-2")).toMatchObject({ currentValueCents: 100050, isArchived: false });
    expect(await reserve()).toBe(100000);
    const listed = await listReserveDestinations(database.db);
    expect(listed).toMatchObject([{ description: "APLICACAO CDB", amountCents: 100000, pending: true, beforeReserve: true }]);
    await classify(listed[0].id, 50000);
    expect(await reserve()).toBe(150000);
    await sync();
    expect((await database.db.query.investmentHoldings.findMany()).length).toBe(2);
  });

  it("leaves new positions to the person on a new connection, without value or on a dry run", async () => {
    positions = [position("cdb-9", 1000)];
    await sync();
    expect((await holdingsByAsset()).has("cdb-9")).toBe(false);
    await linkedHolding(400000);
    positions = [position("cdb-1", 4000), position("cdb-8", 0)];
    await sync();
    expect((await holdingsByAsset()).has("cdb-8")).toBe(false);
    positions = [position("cdb-1", 4000), position("cdb-7", 300)];
    await sync(true);
    expect((await holdingsByAsset()).has("cdb-7")).toBe(false);
  });

  it("gives the reserve the yield of existing positions when the contribution opened a new one", async () => {
    await linkedHolding(400000);
    await setReserve(400000);
    feed = [contribution("c1", 1000)];
    positions = [position("cdb-1", 4040), position("cdb-2", 1000)];
    await sync();
    expect(await reserve()).toBe(404000);
  });

  it("lists positions the bank stopped updating and retires them with their allocations", async () => {
    await linkedHolding(400000, "cdb-1", "2026-07-15");
    const stale = await linkedHolding(22545, "cdb-old", "2026-05-20");
    const purpose = await createInvestmentPurpose({ name: "Reserva" }, database.db);
    await upsertInvestmentPurposeAllocation({ holdingId: stale, purposeId: purpose.id, amountCents: 22545, allocatedOn: "2026-07-01" }, database.db);
    await setReserve(100000);
    expect(await listStalePositions(database.db)).toEqual([{ id: stale, name: "cdb-old", currentValueCents: 22545, valueAsOf: "2026-05-20" }]);
    expect((await getInvestmentOverview(database.db)).stalePositions).toHaveLength(1);
    await retireStalePosition({ holdingId: stale }, database.db);
    expect((await holdingsByAsset()).get("cdb-old")).toMatchObject({ isArchived: true, currentValueCents: 0 });
    expect(await database.db.query.investmentPurposeAllocations.findMany()).toEqual([]);
    expect(await listStalePositions(database.db)).toEqual([]);
    positions = [position("cdb-1", 4000), position("cdb-old", 225.45)];
    expect((await sync()).summary?.counts).toMatchObject({ investmentsIgnored: 1 });
    expect((await holdingsByAsset()).get("cdb-old")).toMatchObject({ isArchived: true, currentValueCents: 0 });
    await expect(retireStalePosition({ holdingId: (await holdingsByAsset()).get("cdb-1")!.id }, database.db)).rejects.toMatchObject({ code: "POSITION_NOT_STALE" });
  });
});
