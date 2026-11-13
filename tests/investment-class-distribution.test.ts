import { describe, expect, it } from "vitest";

import { buildAssetClassDistribution } from "@/lib/investment-class-distribution";

describe("investment class distribution", () => {
  it("adds positions by class, drops empty classes and sorts by value", () => {
    expect(buildAssetClassDistribution([
      { assetClass: "fixed_income", currentValueCents: 1000 },
      { assetClass: "equities", currentValueCents: 3000 },
      { assetClass: "fixed_income", currentValueCents: 2500 },
      { assetClass: "real_estate", currentValueCents: 0 },
    ])).toEqual([
      { assetClass: "fixed_income", amountCents: 3500 },
      { assetClass: "equities", amountCents: 3000 },
    ]);
  });
});
