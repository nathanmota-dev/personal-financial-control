import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

import { investmentHoldings, investmentOperations, investmentPortfolio, pluggyItems } from "@/lib/db/schema";
import type { PluggyApi, PluggyRemoteInvestment } from "@/lib/interfaces/pluggy";
import { createInvestmentHolding, createInvestmentPurpose, getInvestmentPortfolioDashboard, upsertInvestmentPurposeAllocation } from "@/lib/server/investment-portfolio";
import { createInvestmentOperation, createOperationalInvestmentAsset, getEmergencyReserveComposition, getInvestmentAssetDetails, getInvestmentOverview, listLongTermInvestmentPositions } from "@/lib/server/investment-operations";
import { configureInvestmentPortfolio, getInvestmentProjection, setBankReserveAmount } from "@/lib/server/investments";
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
    const purpose = await createInvestmentPurpose({ name: "Viagem" }, database.db);
    await upsertInvestmentPurposeAllocation({ holdingId: id, purposeId: purpose.id, amountCents: 100000, allocatedOn: "2026-01-01" }, database.db);
    const run = await sync();
    expect(run.status).toBe("success");
    expect(run.summary?.attention?.map((item) => item.reason)).toEqual(["investment_total_withdrawal", "investment_below_allocations"]);
    expect(await row(id)).toMatchObject({ currentValueCents: 100000, isArchived: false });
  });

  it("lets a redemption lower a holding fully allocated to the reserve, and the allocation follows", async () => {
    const partial = await linkedManual("partial", 689.04, 171273);
    const gone = await linkedManual("gone", 0, 8211);
    positions[1] = position("gone", 0, { status: "TOTAL_WITHDRAWAL" });
    const purpose = await createInvestmentPurpose({ name: "Reserva", kind: "emergency_reserve" }, database.db);
    for (const [holdingId, amountCents] of [[partial, 171273], [gone, 8211]] as const) {
      await upsertInvestmentPurposeAllocation({ holdingId, purposeId: purpose.id, amountCents, allocatedOn: "2026-01-01" }, database.db);
    }
    const run = await sync();
    expect(run.summary).toMatchObject({ counts: { investmentsUpdated: 2, investmentsWithdrawn: 1 } });
    expect(run.summary?.attention?.map((item) => item.reason)).toEqual(["investment_total_withdrawal"]);
    expect((await row(partial)).currentValueCents).toBe(68904);
    expect((await row(gone)).currentValueCents).toBe(0);
    const allocations = await database.db.query.investmentPurposeAllocations.findMany();
    expect(Object.fromEntries(allocations.map((allocation) => [allocation.holdingId, allocation.amountCents]))).toEqual({ [partial]: 68904, [gone]: 0 });
    expect((await sync(true)).summary).toMatchObject({ dryRun: true, counts: { investmentsUpdated: 2 } });
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

describe("bank reserve split", () => {
  const portfolio = () => configureInvestmentPortfolio({ checkpointBalanceCents: 5000, expectedMonthlyRateBps: 100, checkpointDate: "2026-01-01" }, database.db);
  const projection = async () => (await getInvestmentProjection(database.db))!;

  it("takes the reserve from the amount set over the bank's values and never rewrites the manual checkpoint", async () => {
    await portfolio();
    await linkedManual("a", 1234.56);
    expect((await sync()).summary?.counts).toMatchObject({ investmentsUpdated: 1 });
    expect(await projection()).toMatchObject({ source: "bank", currentBalanceCents: 0, bank: { totalCents: 123456, configuredReserveCents: null, portfolioCents: 123456 } });

    await setBankReserveAmount({ reserveAmountCents: 100000 }, database.db);
    expect(await projection()).toMatchObject({ currentBalanceCents: 100000, bank: { reserveCents: 100000, portfolioCents: 23456, exceedsTotal: false } });
    expect(await getInvestmentOverview(database.db)).toMatchObject({ totalCents: 123456, reserve: { amountCents: 100000, configured: true }, portfolioCents: 23456 });

    // The reserve takes its share of the yield: 76544 × 100000 / 123456.
    positions[0] = position("a", 2000);
    await sync();
    expect((await projection()).bank).toMatchObject({ totalCents: 200000, reserveCents: 162001, portfolioCents: 37999 });
    expect((await database.db.query.investmentPortfolio.findFirst())).toMatchObject({ checkpointBalanceCents: 5000, checkpointDate: "2026-01-01" });
  });

  it("refuses an amount above the total and a split without linked positions", async () => {
    await manualHolding("Manual", 70000);
    await expect(setBankReserveAmount({ reserveAmountCents: 1000 }, database.db)).rejects.toMatchObject({ code: "BANK_RESERVE_REQUIRES_LINKED_POSITION" });
    expect(await getInvestmentProjection(database.db)).toBeNull();
    await linkedManual("a", 100);
    await expect(setBankReserveAmount({ reserveAmountCents: 170001 }, database.db)).rejects.toMatchObject({ code: "BANK_RESERVE_ABOVE_TOTAL" });
    await setBankReserveAmount({ reserveAmountCents: 170000 }, database.db);
    expect((await database.db.query.investmentPortfolio.findFirst())).toMatchObject({ reserveAmountCents: 170000, checkpointBalanceCents: 0 });
  });

  it("shows the total as the reserve when a redemption leaves less than the amount set", async () => {
    await linkedManual("a", 1000, 100000);
    await setBankReserveAmount({ reserveAmountCents: 90000 }, database.db);
    positions[0] = position("a", 500);
    await sync();
    expect((await projection()).bank).toMatchObject({ totalCents: 50000, reserveCents: 50000, portfolioCents: 0, exceedsTotal: true });
  });

  it("projects with the realized rate of the synced positions once two syncs exist", async () => {
    await linkedManual("a", 1000, 100000);
    await sync();
    expect((await projection()).bank?.realizedYield).toBeNull();
    vi.setSystemTime(new Date("2026-07-26T12:00:00.000Z"));
    positions[0] = position("a", 1010, { date: "2026-07-25T00:00:00.000Z" });
    await sync();
    await setBankReserveAmount({ reserveAmountCents: 50000 }, database.db);
    const result = await projection();
    expect(result.bank?.realizedYield).toEqual({ monthlyRateBps: 300, periodDays: 10, reserveMonthlyYieldCents: 1500 });
    expect(result.expectedMonthlyRateBps).toBe(300);
    expect(result.checkpointDate).toBe("2026-07-25");
  });

  it("lists every holding in the portfolio and takes the reserve from the distribution", async () => {
    const id = await linkedManual("a", 1000, 100000);
    await reserveAllocation(id, 100000);
    await sync();
    await setBankReserveAmount({ reserveAmountCents: 40000 }, database.db);
    expect((await listLongTermInvestmentPositions(database.db)).map((row) => row.id)).toEqual([id]);
    expect((await getInvestmentOverview(database.db)).distribution).toEqual([{ assetClass: "fixed_income", amountCents: 60000 }]);
  });
});


describe("reserve yield", () => {
  const reserve = async () => (await database.db.query.investmentPortfolio.findFirst())?.reserveAmountCents;

  it("keeps all the yield in a reserve that holds everything, once per day", async () => {
    await linkedManual("a", 1000, 100000);
    await setBankReserveAmount({ reserveAmountCents: 100000 }, database.db);
    positions[0] = position("a", 1012.34);
    await sync();
    expect(await reserve()).toBe(101234);
    await sync();
    expect(await reserve()).toBe(101234);
    expect((await getInvestmentProjection(database.db))!.bank).toMatchObject({ reserveCents: 101234, portfolioCents: 0 });
  });

  it("shares the yield by what each side holds and ignores drops and positions without a value", async () => {
    await linkedManual("a", 3000, 300000);
    await linkedManual("b", 1000, 100000);
    await linkedManual("c", 0, 0);
    await setBankReserveAmount({ reserveAmountCents: 300000 }, database.db);
    positions[0] = position("a", 3030);
    positions[1] = position("b", 1010);
    positions[2] = position("c", 50);
    await sync();
    expect(await reserve()).toBe(303000);
    positions[1] = position("b", 500);
    await sync();
    expect(await reserve()).toBe(303000);
  });

  it("writes nothing on a dry run and leaves an unset reserve alone", async () => {
    await linkedManual("a", 1000, 100000);
    await setBankReserveAmount({ reserveAmountCents: 100000 }, database.db);
    positions[0] = position("a", 1100);
    await sync(true);
    expect(await reserve()).toBe(100000);
    await database.db.update(investmentPortfolio).set({ reserveAmountCents: null });
    await sync();
    expect(await reserve()).toBeNull();
  });
});
