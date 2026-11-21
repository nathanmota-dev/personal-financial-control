import type {
  PredictabilityResult,
  PredictabilitySimulatedPurchase,
  PredictabilitySimulation,
} from "@/lib/interfaces/predictability";
import { calculatePredictability } from "@/lib/predictability";

export const SIMULATED_PURCHASE_ID = "simulated-purchase";

/**
 * Recalculates the cycle as if the purchase had been made, with the same rules as a real expense:
 * it consumes its own day and the following ones. It runs after the real entries of the same day.
 */
export function simulatePurchase(
  base: PredictabilityResult,
  purchase: PredictabilitySimulatedPurchase
): PredictabilitySimulation {
  const result = calculatePredictability({
    today: base.today,
    cycle: base.cycle,
    budgetItems: base.budgetItems,
    expenses: [
      ...base.days.flatMap((day) => day.expenses),
      {
        id: SIMULATED_PURCHASE_ID,
        date: purchase.date,
        description: purchase.description,
        amountCents: purchase.amountCents,
        categoryName: "Simulação",
      },
    ],
  });
  const consumedByDate: Record<string, number> = {};

  for (const day of result.days) {
    const cents = day.allocations
      .filter((allocation) => allocation.transactionId === SIMULATED_PURCHASE_ID)
      .reduce((total, allocation) => total + allocation.cents, 0);

    if (cents > 0) {
      consumedByDate[day.date] = cents;
    }
  }

  return {
    result,
    impact: {
      purchase,
      consumedByDate,
      affectedDates: Object.keys(consumedByDate),
      remainingBeforeCents: base.summary.remainingCents,
      remainingAfterCents: result.summary.remainingCents,
      freeDaysBefore: base.summary.freeDays,
      freeDaysAfter: result.summary.freeDays,
      overflowAddedCents: result.summary.overflowCents - base.summary.overflowCents,
    },
  };
}

/** First day a purchase can be simulated on: today inside the current cycle, otherwise the cycle start. */
export function resolveSimulationMinDate(base: Pick<PredictabilityResult, "today" | "cycle">) {
  const { today, cycle } = base;
  return today >= cycle.start && today <= cycle.end ? today : cycle.start;
}
