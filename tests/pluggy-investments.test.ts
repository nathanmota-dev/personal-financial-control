import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { investmentHoldings, investmentOperations, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteInvestment } from "@/lib/interfaces/pluggy";
import { createInvestmentHolding, createInvestmentPurpose, getInvestmentPortfolioDashboard, upsertInvestmentPurposeAllocation } from "@/lib/server/investment-portfolio";
import { createInvestmentOperation, createOperationalInvestmentAsset, getEmergencyReserveComposition, getInvestmentAssetDetails } from "@/lib/server/investment-operations";
import { configureInvestmentPortfolio, getInvestmentProjection } from "@/lib/server/investments";
import { pluggyRuntime } from "@/lib/server/pluggy/config";
import { pluggyHttpError } from "@/lib/server/pluggy/errors";
import { getPluggyInvestmentOverview, linkPluggyInvestment, unlinkPluggyInvestment } from "@/lib/server/pluggy/investments/links";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { createTestDatabase } from "@/tests/helpers/database";

type Database = Awaited<ReturnType<typeof createTestDatabase>>;

let database: Database;
let itemId: string;
let positions: PluggyRemoteInvestment[];
let listInvestments: PluggyApi["listInvestments"];

const position = (id: string, balance: number, overrides: Partial<PluggyRemoteInvestment> = {}): PluggyRemoteInvestment => ({ id, name: `CDB ${id}`, type: "FIXED_INCOME", subtype: "CDB", balance, amount: balance + 50, date: "2026-07-15T00:00:00.000Z", issuer: "Banco Emissor", status: "ACTIVE", ...overrides });

function api(): PluggyApi {
  return {
    getItem: vi.fn(async (id: string) => ({ id, status: "UPDATED" })),
    listAccounts: vi.fn(async () => []),
    listTransactions: vi.fn(async () => []),
    listBills: vi.fn(async () => []),
    listInvestments,
  };
}

const sync = (dryRun = false) => runPluggySync({ db: database.db, client: api(), dryRun });
const manualHolding = (name: string, currentValueCents: number) => createInvestmentHolding({ name, assetClass: "fixed_income", instrumentType: "cdb", currentValueCents, valueAsOf: "2026-01-01" }, database.db);
const link = (externalAssetId: string, holdingId: string | null) => linkPluggyInvestment({ itemId, externalAssetId, holdingId }, database.db, api());
const row = async (id: string) => (await database.db.query.investmentHoldings.findFirst({ where: eq(investmentHoldings.id, id) }))!;
const holdingCount = async () => (await database.db.query.investmentHoldings.findMany()).length;
const snapshots = () => database.db.query.investmentPositionSnapshots.findMany();

async function linkedManual(id: string, balance: number, start = 100000) {
  positions.push(position(id, balance));
  const holding = await manualHolding(`Local ${id}`, start);
  await link(id, holding.id);
  return holding.id;
}

async function reserveAllocation(holdingId: string, amountCents: number) {
  const purpose = await createInvestmentPurpose({ name: "Reserva", kind: "emergency_reserve" }, database.db);
  await upsertInvestmentPurposeAllocation({ holdingId, purposeId: purpose.id, amountCents, allocatedOn: "2026-01-01" }, database.db);
}

async function quotedHolding(valueCents: number) {
  const holding = await createOperationalInvestmentAsset({ name: "Ação", type: "stock", ticker: "PETR4", assetClass: "equities", instrumentType: "stock", valuationMode: "market_quote" }, database.db);
  await database.db.update(investmentHoldings).set({ currentValueCents: valueCents, valueAsOf: "2026-07-10" }).where(eq(investmentHoldings.id, holding.id));
  return holding.id;
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-07-16T12:00:00.000Z"));
  database = await createTestDatabase();
  [{ id: itemId }] = await database.db.insert(pluggyItems).values({ externalItemId: "item-1", label: "Banco", connectorName: "MeuPluggy", status: "UPDATED" }).returning();
  positions = [];
  listInvestments = vi.fn(async () => positions);
  pluggyRuntime().syncRunning = false;
});

afterEach(async () => {
  vi.useRealTimers();
  database.db.$client.close();
  await database.cleanup();
});

describe("Pluggy investment positions sync", () => {
  it("gives a linked manual holding the bank's net value and date, without touching what the user named", async () => {
    const id = await linkedManual("a", 1234.56);
    await database.db.update(investmentHoldings).set({ notes: "minha nota" }).where(eq(investmentHoldings.id, id));
    const run = await sync();
    expect(run).toMatchObject({ status: "success", summary: { counts: { investmentsUpdated: 1 }, attention: [] } });
    expect(await row(id)).toMatchObject({ currentValueCents: 123456, valueAsOf: "2026-07-15", name: "Local a", notes: "minha nota", assetClass: "fixed_income", institutionName: null });
  });

  it("gives a contract estimate holding the bank value and keeps it through a recalculation", async () => {
    positions.push(position("a", 500));
    const holding = await createOperationalInvestmentAsset({ name: "Contrato", assetClass: "fixed_income", instrumentType: "cdb", valuationMode: "contract_estimate" }, database.db);
    await link("a", holding.id);
    await sync();
    expect(await row(holding.id)).toMatchObject({ currentValueCents: 50000, valuationMode: "contract_estimate" });
    await createInvestmentOperation({ holdingId: holding.id, type: "application", operatedOn: "2026-07-16", grossAmountCents: 1000 }, database.db);
    expect((await row(holding.id)).currentValueCents).toBe(50000);
  });

  it("keeps a market quote holding and reports the signed difference from the bank", async () => {
    positions.push(position("q", 120));
    const id = await quotedHolding(10000);
    await link("q", id);
    const run = await sync();
    expect(run.summary).toMatchObject({ counts: { investmentsQuoted: 1 }, attention: [{ reason: "investment_quote_difference", amountCents: 2000, description: "CDB q", accountLabel: "Banco" }] });
    expect(await row(id)).toMatchObject({ currentValueCents: 10000, valueAsOf: "2026-07-10" });
    expect(await snapshots()).toHaveLength(0);
  });

  it("reports no difference for a quoted holding that agrees with the bank", async () => {
    positions.push(position("q", 100));
    await link("q", await quotedHolding(10000));
    expect((await sync()).summary?.attention).toEqual([]);
  });

  it("isolates a holding below its allocations and keeps syncing the others", async () => {
    const below = await linkedManual("below", 400);
    const after = await linkedManual("after", 700);
    const purpose = await createInvestmentPurpose({ name: "Viagem" }, database.db);
    await upsertInvestmentPurposeAllocation({ holdingId: below, purposeId: purpose.id, amountCents: 50000, allocatedOn: "2026-01-01" }, database.db);
    const run = await sync();
    expect(run).toMatchObject({ status: "success", summary: { counts: { investmentsBelowAllocations: 1, investmentsUpdated: 1 }, attention: [{ reason: "investment_below_allocations", amountCents: 40000 }] } });
    expect((await row(below)).currentValueCents).toBe(100000);
    expect((await row(after)).currentValueCents).toBe(70000);
    expect((await snapshots()).map((snapshot) => snapshot.holdingId)).toEqual([after]);
  });

  it("writes one position snapshot per date, and replaces it on a repeated run", async () => {
    const id = await linkedManual("a", 100);
    await sync();
    expect(await snapshots()).toMatchObject([{ holdingId: id, snapshotDate: "2026-07-16", currentValueCents: 10000, valuationSource: "manual_balance", costCents: null }]);
    positions[0] = position("a", 150);
    await expect(sync()).resolves.toMatchObject({ status: "success" });
    expect(await snapshots()).toMatchObject([{ snapshotDate: "2026-07-16", currentValueCents: 15000 }]);
    vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
    await sync();
    expect((await snapshots()).map((snapshot) => snapshot.snapshotDate).sort()).toEqual(["2026-07-16", "2026-07-17"]);
    expect(await database.db.query.investmentPortfolioSnapshots.findMany()).toHaveLength(2);
  });

  it("keeps the known cost in the snapshot of a holding with operations", async () => {
    const id = await linkedManual("a", 100);
    await createInvestmentOperation({ holdingId: id, type: "application", operatedOn: "2026-07-01", grossAmountCents: 8000 }, database.db);
    await sync();
    expect(await snapshots()).toMatchObject([{ currentValueCents: 10000, costCents: 8000 }]);
  });

  it("updates the emergency reserve and portfolio totals", async () => {
    const id = await linkedManual("a", 1500);
    await reserveAllocation(id, 100000);
    await sync();
    const reserve = await getEmergencyReserveComposition(database.db);
    expect(reserve.registeredCents).toBe(150000);
    expect(reserve.holdings).toMatchObject([{ amountCents: 150000, valueAsOf: "2026-07-15" }]);
    expect((await getInvestmentPortfolioDashboard(database.db)).holdings).toMatchObject([{ id, currentValueCents: 150000 }]);
    const details = await getInvestmentAssetDetails(id, database.db);
    expect(details?.snapshots).toMatchObject([{ currentValueCents: 150000 }]);
  });

  it("flags a total withdrawal, applies the zero balance and never archives", async () => {
    const id = await linkedManual("gone", 0);
    positions[0] = position("gone", 0, { status: "TOTAL_WITHDRAWAL" });
    const run = await sync();
    expect(run).toMatchObject({ status: "success", summary: { counts: { investmentsWithdrawn: 1, investmentsUpdated: 1 }, attention: [{ reason: "investment_total_withdrawal", amountCents: 0 }] } });
    expect(await row(id)).toMatchObject({ currentValueCents: 0, isArchived: false });
  });

  it("flags a withdrawal even when the holding is below its allocations, without aborting", async () => {
    const id = await linkedManual("gone", 0);
    positions[0] = position("gone", 0, { status: "TOTAL_WITHDRAWAL" });
    await reserveAllocation(id, 100000);
    const run = await sync();
    expect(run.status).toBe("success");
    expect(run.summary?.attention?.map((item) => item.reason)).toEqual(["investment_total_withdrawal", "investment_below_allocations"]);
    expect(await row(id)).toMatchObject({ currentValueCents: 100000, isArchived: false });
  });

  it("never overwrites a holding when the bank sends no usable value", async () => {
    const id = await linkedManual("a", 100);
    positions[0] = position("a", 100, { balance: null });
    const withdrawn = await linkedManual("b", 100);
    positions[1] = position("b", 100, { balance: null, status: "TOTAL_WITHDRAWAL" });
    const run = await sync();
    expect(run.summary).toMatchObject({ counts: { investmentsWithoutValue: 2, investmentsWithdrawn: 1 } });
    expect(run.summary?.attention?.map((item) => item.reason)).toEqual(["investment_missing_value", "investment_total_withdrawal", "investment_missing_value"]);
    expect((await row(id)).currentValueCents).toBe(100000);
    expect((await row(withdrawn)).currentValueCents).toBe(100000);
  });

  it("counts unlinked positions and ignores archived holdings", async () => {
    positions.push(position("free", 10));
    const id = await linkedManual("old", 10, 0);
    await database.db.update(investmentHoldings).set({ isArchived: true }).where(eq(investmentHoldings.id, id));
    expect((await sync()).summary?.counts).toMatchObject({ investmentsUnlinked: 1, investmentsIgnored: 1 });
    expect((await row(id)).currentValueCents).toBe(0);
  });

  it("reports a connector without investments, and an unreadable resource, without failing", async () => {
    expect(await sync()).toMatchObject({ status: "success", summary: { counts: { investmentItemsEmpty: 1 }, failures: [] } });
    listInvestments = vi.fn(async () => { throw pluggyHttpError(404); });
    expect(await sync()).toMatchObject({ status: "success", summary: { counts: { investmentItemsUnavailable: 1 }, failures: [] } });
  });

  it("isolates an unexpected failure to the investment step of the connection", async () => {
    listInvestments = vi.fn(async () => { throw new Error("boom"); });
    await expect(sync()).resolves.toMatchObject({ summary: { failures: [{ scope: "item", step: "sync-investment-positions", code: "PLUGGY_STEP_FAILED" }] } });
  });

  it("writes nothing on a dry run but reports what would happen", async () => {
    const id = await linkedManual("a", 200);
    const below = await linkedManual("b", 10);
    const purpose = await createInvestmentPurpose({ name: "Viagem" }, database.db);
    await upsertInvestmentPurposeAllocation({ holdingId: below, purposeId: purpose.id, amountCents: 50000, allocatedOn: "2026-01-01" }, database.db);
    const run = await sync(true);
    expect(run.summary).toMatchObject({ dryRun: true, counts: { investmentsUpdated: 1, investmentsBelowAllocations: 1 } });
    expect((await row(id)).currentValueCents).toBe(100000);
    expect(await snapshots()).toHaveLength(0);
  });

  it("reports any other domain error as a step failure, before changing the holding", async () => {
    const id = await linkedManual("a", 100);
    await database.db.insert(investmentOperations).values({ holdingId: id, type: "redemption", operatedOn: "2026-07-01", grossAmountCents: 100 });
    await expect(sync()).resolves.toMatchObject({ summary: { failures: [{ step: "sync-investment-positions", code: "INSUFFICIENT_POSITION" }] } });
    expect((await row(id)).currentValueCents).toBe(100000);
  });
});

describe("Pluggy investment links", () => {
  it("links an existing holding and keeps it through repeated syncs, without duplicates", async () => {
    const id = await linkedManual("a", 100);
    expect(await row(id)).toMatchObject({ externalProvider: "pluggy", externalAssetId: "a" });
    await sync();
    await sync();
    expect(await holdingCount()).toBe(1);
    expect(await row(id)).toMatchObject({ externalAssetId: "a", currentValueCents: 10000 });
  });

  it("creates a holding from the remote position, with the name only at creation", async () => {
    positions.push(position("new", 321.09));
    await link("new", null);
    const [created] = await database.db.query.investmentHoldings.findMany();
    expect(created).toMatchObject({ name: "CDB new", institutionName: "Banco Emissor", assetClass: "fixed_income", instrumentType: "cdb", valuationMode: "manual_balance", currentValueCents: 32109, valueAsOf: "2026-07-15", externalProvider: "pluggy", externalAssetId: "new" });
    positions[0] = position("new", 400, { name: "Nome novo do banco" });
    await sync();
    expect(await row(created.id)).toMatchObject({ name: "CDB new", currentValueCents: 40000 });
    expect(await holdingCount()).toBe(1);
  });

  it("rejects a second link for the same position, so no duplicate is created", async () => {
    positions.push(position("a", 10));
    await link("a", null);
    await expect(link("a", null)).rejects.toMatchObject({ code: "PLUGGY_INVESTMENT_LINK_EXISTS", status: 409 });
    expect(await holdingCount()).toBe(1);
  });

  it("rejects a holding that is already linked, archived or unknown", async () => {
    const taken = await linkedManual("a", 10);
    positions.push(position("b", 10));
    await expect(link("b", taken)).rejects.toMatchObject({ code: "PLUGGY_HOLDING_ALREADY_LINKED" });
    const archived = await manualHolding("Arquivado", 0);
    await database.db.update(investmentHoldings).set({ isArchived: true }).where(eq(investmentHoldings.id, archived.id));
    await expect(link("b", archived.id)).rejects.toMatchObject({ code: "INVESTMENT_HOLDING_NOT_FOUND" });
    await expect(link("b", "missing")).rejects.toMatchObject({ code: "INVESTMENT_HOLDING_NOT_FOUND" });
  });

  it("rejects unknown connections and positions from another connection", async () => {
    positions.push(position("a", 10));
    await expect(linkPluggyInvestment({ itemId: "missing", externalAssetId: "a", holdingId: null }, database.db, api())).rejects.toMatchObject({ code: "PLUGGY_ITEM_NOT_FOUND" });
    await expect(link("foreign", null)).rejects.toMatchObject({ code: "PLUGGY_INVESTMENT_NOT_FOUND" });
  });

  it("refuses to create a holding from a position without a value", async () => {
    positions.push(position("a", 10, { balance: null }));
    await expect(link("a", null)).rejects.toMatchObject({ code: "PLUGGY_INVESTMENT_WITHOUT_VALUE" });
    expect(await holdingCount()).toBe(0);
  });

  it("unlinks a holding, which then stops following the bank", async () => {
    const id = await linkedManual("a", 100);
    await unlinkPluggyInvestment(id, database.db);
    expect(await row(id)).toMatchObject({ externalProvider: null, externalAssetId: null });
    expect((await sync()).summary?.counts).toMatchObject({ investmentsUnlinked: 1 });
    expect((await row(id)).currentValueCents).toBe(100000);
    await expect(unlinkPluggyInvestment("missing", database.db)).rejects.toMatchObject({ code: "INVESTMENT_HOLDING_NOT_FOUND" });
  });

  it("lists positions with link state, suggestions and notices for connections without positions", async () => {
    const linked = await linkedManual("a", 100);
    positions.push(position("b", 20, { name: "Tesouro Selic", status: "TOTAL_WITHDRAWAL" }));
    const free = await manualHolding("Tesouro Selic", 0);
    const archived = await manualHolding("Velho", 0);
    await database.db.update(investmentHoldings).set({ isArchived: true }).where(eq(investmentHoldings.id, archived.id));
    await database.db.insert(pluggyItems).values({ externalItemId: "item-2", label: "Sem produtos", connectorName: "MeuPluggy", status: "UPDATED" });
    const client = api();
    client.listInvestments = vi.fn(async (external: string) => external === "item-1" ? positions : []);
    const overview = await getPluggyInvestmentOverview(database.db, client);
    expect(overview.investments).toMatchObject([
      { externalAssetId: "a", itemLabel: "Banco", link: { holdingId: linked, holdingName: "Local a" }, suggestedHoldingId: null, withdrawn: false },
      { externalAssetId: "b", link: null, suggestedHoldingId: free.id, withdrawn: true, currentValueCents: 2000 },
    ]);
    expect(overview.holdings.map((holding) => holding.id)).toEqual([free.id]);
    expect(overview.notices).toMatchObject([{ label: "Sem produtos", failed: false }]);
  });

  it("shows an unreadable connection as a failed notice, and propagates unexpected errors", async () => {
    listInvestments = vi.fn(async () => { throw pluggyHttpError(503); });
    await expect(getPluggyInvestmentOverview(database.db, api())).resolves.toMatchObject({ investments: [], notices: [{ failed: true, message: "A Pluggy está indisponível no momento." }] });
    listInvestments = vi.fn(async () => { throw new Error("boom"); });
    await expect(getPluggyInvestmentOverview(database.db, api())).rejects.toThrow("boom");
  });
});

describe("emergency reserve checkpoint", () => {
  const portfolio = () => configureInvestmentPortfolio({ checkpointBalanceCents: 5000, expectedMonthlyRateBps: 100, checkpointDate: "2026-01-01" }, database.db);

  it("uses the bank's value as the balance of the reserve screen", async () => {
    await portfolio();
    const id = await linkedManual("a", 1234.56);
    await reserveAllocation(id, 100000);
    const run = await sync();
    expect(run.summary?.counts).toMatchObject({ reserveCheckpointUpdated: 1 });
    expect((await getInvestmentProjection(database.db))?.currentBalanceCents).toBe(123456);
    expect((await getEmergencyReserveComposition(database.db)).differenceCents).toBe(0);
    expect((await sync()).summary?.counts).not.toHaveProperty("reserveCheckpointUpdated");
  });

  it("leaves a reserve without linked positions and a dry run untouched", async () => {
    await portfolio();
    const manual = await manualHolding("Manual", 70000);
    await reserveAllocation(manual.id, 70000);
    await sync();
    expect((await database.db.query.investmentPortfolio.findFirst())?.checkpointBalanceCents).toBe(5000);
    await linkedManual("a", 1000);
    const linked = (await database.db.query.investmentHoldings.findMany()).find((row) => row.externalAssetId)!;
    const purpose = (await database.db.query.investmentPurposes.findFirst())!;
    await upsertInvestmentPurposeAllocation({ holdingId: linked.id, purposeId: purpose.id, amountCents: 100000, allocatedOn: "2026-01-01" }, database.db);
    await sync(true);
    expect((await database.db.query.investmentPortfolio.findFirst())?.checkpointBalanceCents).toBe(5000);
  });
});
