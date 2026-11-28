import type { BankContributionBackfill, BankPurchase } from "@/lib/interfaces/investments";

type DatedPurchase = { principalCents: number; purchasedOn: string };

function isDated(purchase: BankPurchase): purchase is DatedPurchase {
  return (purchase.principalCents ?? 0) > 0 && Boolean(purchase.purchasedOn);
}

/**
 * Contributions the bank still shows but the platform never recorded: the positions bought before the first
 * recorded movement, by purchase month. The bank only reports the principal left after redemptions, and those
 * redemptions are already recorded, so the part they took is added back to the first month. The cumulative
 * movement then ends at the principal invested today. Without anything recorded, the positions are the history.
 *
 * Pure. `positions` are the active bank-linked holdings; `recordedNetCents` is contributions minus withdrawals.
 */
export function buildBankContributionBackfill(positions: BankPurchase[], recordedSince: string | null, recordedNetCents: number): { monthlyCents: Map<string, number>; backfill: BankContributionBackfill } | null {
  const earlier = positions.filter(isDated).filter((purchase) => !recordedSince || purchase.purchasedOn < recordedSince);
  if (!earlier.length) return null;
  const monthlyCents = new Map<string, number>();
  for (const { principalCents, purchasedOn } of earlier) monthlyCents.set(purchasedOn.slice(0, 7), (monthlyCents.get(purchasedOn.slice(0, 7)) ?? 0) + principalCents);
  const positionsCents = earlier.reduce((total, purchase) => total + purchase.principalCents, 0);
  // A position without a principal leaves the invested total unknown, so nothing is added back.
  const principalKnown = positions.every((purchase) => purchase.principalCents !== null);
  const principalCents = positions.reduce((total, purchase) => total + (purchase.principalCents ?? 0), 0);
  const adjustmentCents = principalKnown ? Math.max(0, principalCents - positionsCents - recordedNetCents) : 0;
  const firstMonth = [...monthlyCents.keys()].sort()[0];
  monthlyCents.set(firstMonth, (monthlyCents.get(firstMonth) ?? 0) + adjustmentCents);
  return { monthlyCents, backfill: { positionsCents, adjustmentCents, recordedSince } };
}
