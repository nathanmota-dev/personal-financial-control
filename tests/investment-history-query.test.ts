import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { investmentHoldings, investmentPositionSnapshots } from "@/lib/db/schema";
import { getInvestmentHistory } from "@/lib/server/investment-operations";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];
beforeEach(() => {
  vi.stubEnv("DEMO_MODE", "false");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-07-16T12:00:00Z"));
});
afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

async function database() {
  const test = await createTestDatabase();
  cleanups.push(test.cleanup);
  return test.db;
}

async function holding(db: Awaited<ReturnType<typeof database>>, currentValueCents: number, snapshots: [string, number][]) {
  const [row] = await db.insert(investmentHoldings).values({ name: "CDB", assetClass: "fixed_income", instrumentType: "cdb", currentValueCents, valueAsOf: "2026-07-16" }).returning();
  for (const [snapshotDate, value] of snapshots) {
    await db.insert(investmentPositionSnapshots).values({ holdingId: row.id, snapshotDate, currentValueCents: value, valuationSource: "manual_balance" });
  }
}

describe("investment history query", () => {
  it("builds the monthly history and asks the indexes for its months", async () => {
    const db = await database();
    await holding(db, 10_300, [["2026-05-31", 10_000], ["2026-06-30", 10_100]]);
    const benchmarks = vi.fn().mockResolvedValue({ cdi: { "2026-06": 0.01 }, ipca: null, ibov: null });
    const history = await getInvestmentHistory(db, { benchmarks });
    expect(history.points.map((point) => [point.month, point.valueCents, point.gainCents])).toEqual([["2026-05", 10_000, 0], ["2026-06", 10_100, 100], ["2026-07", 10_300, 200]]);
    expect(benchmarks).toHaveBeenCalledWith("2026-05", "2026-07");
    expect(history.benchmarks.cdi).toEqual({ "2026-06": 0.01 });
  });

  it("does not ask for the indexes with a single month", async () => {
    const db = await database();
    await holding(db, 10_000, [["2026-07-01", 10_000]]);
    const benchmarks = vi.fn();
    expect(await getInvestmentHistory(db, { benchmarks })).toEqual({
      points: [expect.objectContaining({ month: "2026-07", valueCents: 10_000 })],
      benchmarks: { cdi: null, ipca: null, ibov: null },
    });
    expect(benchmarks).not.toHaveBeenCalled();
  });
});
