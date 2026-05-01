import { afterEach, describe, expect, it } from "vitest";

import {
  getInvestmentProjection,
  saveInvestmentPortfolio,
} from "@/lib/server/investments";
import { createTestDatabase } from "@/tests/helpers/database";

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

describe("investments", () => {
  it("projects compound growth for fixed horizons", async () => {
    const { db, cleanup } = await createTestDatabase();
    cleanups.push(cleanup);

    await saveInvestmentPortfolio(
      {
        currentBalanceCents: 100000,
        monthlyContributionCents: 10000,
        expectedMonthlyRateBps: 100,
        referenceDate: "2026-05-01",
      },
      db
    );

    const projection = await getInvestmentProjection(24, db);

    expect(projection?.projection[1]).toBe(111000);
    expect(projection?.projection[6]).toBeGreaterThan(160000);
    expect(projection?.projection[12]).toBeGreaterThan(projection?.projection[6] ?? 0);
    expect(projection?.projection[24]).toBeGreaterThan(projection?.projection[12] ?? 0);
  });
});
