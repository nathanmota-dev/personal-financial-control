import { describe, expect, it } from "vitest";

import { calculatePredictability, resolveCycle } from "@/lib/predictability";
import { resolveSimulationMinDate, SIMULATED_PURCHASE_ID, simulatePurchase } from "@/lib/predictability-simulation";

// R$ 50 per day: R$ 1.550 left over in a 31-day July with the pay day on the 1st.
const base = calculatePredictability({
  today: "2026-07-16",
  cycle: resolveCycle(1, "2026-07-16"),
  budgetItems: [{ id: "salary", kind: "income", description: "Salário", date: "2026-07-01", amountCents: 155000 }],
  expenses: [{ id: "lunch", date: "2026-07-20", description: "Almoço", amountCents: 2000 }],
});

describe("predictability purchase simulation", () => {
  it("shows how many days a purchase consumes without touching the real cycle", () => {
    const { result, impact } = simulatePurchase(base, { date: "2026-07-20", amountCents: 30000, description: "Fone" });

    expect(impact.affectedDates).toEqual(["2026-07-20", "2026-07-21", "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-25", "2026-07-26"]);
    expect(impact.consumedByDate["2026-07-20"]).toBe(3000);
    expect(impact.consumedByDate["2026-07-26"]).toBe(2000);
    expect(impact).toMatchObject({
      remainingBeforeCents: 153000,
      remainingAfterCents: 123000,
      freeDaysBefore: 15,
      freeDaysAfter: 9,
      overflowAddedCents: 0,
    });
    expect(result.days[19].expenses.map((expense) => expense.id)).toEqual(["lunch", SIMULATED_PURCHASE_ID]);
    expect(base.days[19].expenses).toHaveLength(1);
    expect(base.summary.remainingCents).toBe(153000);
  });

  it("reports the part of the purchase that overflows the cycle", () => {
    const { impact } = simulatePurchase(base, { date: "2026-07-30", amountCents: 200000, description: "TV" });

    expect(impact.affectedDates).toHaveLength(31);
    expect(impact.remainingAfterCents).toBe(0);
    expect(impact.overflowAddedCents).toBe(47000);
  });

  it("starts the simulation today inside the current cycle and on the first day otherwise", () => {
    expect(resolveSimulationMinDate(base)).toBe("2026-07-16");
    expect(resolveSimulationMinDate({ today: "2026-06-20", cycle: base.cycle })).toBe("2026-07-01");
  });
});
