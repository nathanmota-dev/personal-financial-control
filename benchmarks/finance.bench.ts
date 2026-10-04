import { bench, describe } from "vitest";

import { calculateCompoundInterest } from "@/lib/compound-interest";
import { calculateDailyProjection } from "@/lib/projected-balance";
import { benchmarkOptions, compoundInterestInput, projectionInput } from "./fixtures";

const fiveYears = compoundInterestInput(5);
const fiftyYears = compoundInterestInput(50);
const typicalProjection = projectionInput(100, false);
const clusteredProjection = projectionInput(5000, true);

describe("Compound interest", () => {
  bench("5 years with monthly contributions (60 months)", () => {
    calculateCompoundInterest(fiveYears);
  }, benchmarkOptions);

  bench("50 years with monthly contributions (600 months)", () => {
    calculateCompoundInterest(fiftyYears);
  }, benchmarkOptions);
});

describe("Projected balance", () => {
  bench("90 days with 100 distributed events", () => {
    calculateDailyProjection(typicalProjection);
  }, benchmarkOptions);

  bench("90 days with 5000 events sharing three dates", () => {
    calculateDailyProjection(clusteredProjection);
  }, benchmarkOptions);
});
