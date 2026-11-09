import type { PluggyInstallmentObservation, PluggyInstallmentTotal } from "@/lib/interfaces/pluggy-card-import";

/** `remainder` is how many of the first installments carry one extra cent, as in `splitInstallmentAmounts`. */
function fromRemainderRange(base: number, count: number, lowest: number, highest: number): PluggyInstallmentTotal {
  return { totalCents: base * count + lowest, residualCents: highest - lowest };
}

function fromMixedAmounts(observed: PluggyInstallmentObservation[], base: number, count: number) {
  const numbers = (amount: (cents: number) => boolean) => observed.filter((item) => amount(item.amountCents)).map((item) => item.installmentNumber);
  const lastWithExtraCent = Math.max(...numbers((cents) => cents > base));
  const firstWithoutExtraCent = Math.min(...numbers((cents) => cents === base));
  // The extra cents are not on the first installments, so the observed ones say nothing about the rest.
  if (lastWithExtraCent > firstWithoutExtraCent) return fromRemainderRange(base, count, lastWithExtraCent, lastWithExtraCent + count - 1);
  return fromRemainderRange(base, count, lastWithExtraCent, firstWithoutExtraCent - 1);
}

/** With one amount visible, the unseen installments may hold extra cents, or the visible ones may be the only ones with them. */
function fromSingleAmount(observed: PluggyInstallmentObservation[], amount: number, count: number): PluggyInstallmentTotal {
  const numbers = observed.map((item) => item.installmentNumber);
  return { totalCents: amount * count, residualCents: Math.max(Math.min(...numbers) - 1, count - Math.max(...numbers)) };
}

/** Pure. `observed` holds at most one amount per installment number. */
export function rebuildInstallmentTotal(observed: PluggyInstallmentObservation[], count: number): PluggyInstallmentTotal {
  if (observed.length === count) return { totalCents: observed.reduce((sum, item) => sum + item.amountCents, 0), residualCents: 0 };
  const amounts = observed.map((item) => item.amountCents);
  const base = Math.min(...amounts);
  return Math.max(...amounts) > base ? fromMixedAmounts(observed, base, count) : fromSingleAmount(observed, base, count);
}
