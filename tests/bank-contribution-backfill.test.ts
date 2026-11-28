import { describe, expect, it } from "vitest";

import { buildBankContributionBackfill } from "@/lib/bank-contribution-backfill";

const bought = (purchasedOn: string | null, principalCents: number | null) => ({ purchasedOn, principalCents });
const monthly = (result: ReturnType<typeof buildBankContributionBackfill>) => Object.fromEntries(result?.monthlyCents ?? []);

describe("bank contribution backfill", () => {
  it("fills the months before the first recorded movement and adds back the principal redeemed since", () => {
    // Recorded: 1.500 in and 300 out. Today the bank holds 1.000 + 800 from earlier and the 1.500 recorded.
    const result = buildBankContributionBackfill([bought("2025-09-03", 100000), bought("2025-12-04", 80000), bought("2026-05-05", 150000)], "2026-05-05", 120000);
    expect(monthly(result)).toEqual({ "2025-09": 100000 + 30000, "2025-12": 80000 });
    expect(result?.backfill).toEqual({ positionsCents: 180000, adjustmentCents: 30000, recordedSince: "2026-05-05" });
  });

  it("builds the whole history from the positions when nothing was recorded", () => {
    const result = buildBankContributionBackfill([bought("2026-01-06", 250000), bought("2026-01-20", 50000), bought("2026-03-05", 2000)], null, 0);
    expect(monthly(result)).toEqual({ "2026-01": 300000, "2026-03": 2000 });
    expect(result?.backfill.adjustmentCents).toBe(0);
  });

  it("adds a position without a purchase date to the first month, so the total still matches", () => {
    expect(monthly(buildBankContributionBackfill([bought("2026-02-05", 1000), bought(null, 500)], null, 0))).toEqual({ "2026-02": 1500 });
  });

  it("adds nothing back while a principal is unknown, or when the records already exceed it", () => {
    expect(buildBankContributionBackfill([bought("2026-02-05", 1000), bought("2026-06-01", null)], "2026-05-01", -900)?.backfill.adjustmentCents).toBe(0);
    expect(buildBankContributionBackfill([bought("2026-02-05", 1000)], "2026-05-01", 5000)?.backfill.adjustmentCents).toBe(0);
  });

  it("returns nothing when every position was recorded, or the bank reports no principal", () => {
    expect(buildBankContributionBackfill([bought("2026-05-05", 1000)], "2026-05-05", 1000)).toBeNull();
    expect(buildBankContributionBackfill([bought("2026-01-05", 0), bought("2026-01-05", null)], null, 0)).toBeNull();
    expect(buildBankContributionBackfill([], null, 0)).toBeNull();
  });
});
