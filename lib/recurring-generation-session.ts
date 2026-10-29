// Months whose recurring transactions were generated in this browser session.
const generatedMonths = new Set<string>();
const pendingMonths = new Set<string>();
let epoch = 0;

export function claimRecurringGeneration(month: string) {
  if (generatedMonths.has(month) || pendingMonths.has(month)) {
    return null;
  }

  pendingMonths.add(month);
  return epoch;
}

export function finishRecurringGeneration(month: string, claim: number, succeeded: boolean) {
  pendingMonths.delete(month);

  // A template change during the request must still trigger a new generation.
  if (succeeded && claim === epoch) {
    generatedMonths.add(month);
  }
}

export function resetRecurringGeneration() {
  epoch += 1;
  generatedMonths.clear();
}
