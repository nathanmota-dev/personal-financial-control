import type { InvestmentClassShare, InvestmentPosition } from "@/lib/interfaces/investment-operations";

/** Current value per asset class, largest first, without empty classes. */
export function buildAssetClassDistribution(positions: Pick<InvestmentPosition, "assetClass" | "currentValueCents">[]): InvestmentClassShare[] {
  const totals = new Map<InvestmentClassShare["assetClass"], number>();
  for (const position of positions) totals.set(position.assetClass, (totals.get(position.assetClass) ?? 0) + position.currentValueCents);
  return [...totals]
    .map(([assetClass, amountCents]) => ({ assetClass, amountCents }))
    .filter((item) => item.amountCents > 0)
    .sort((left, right) => right.amountCents - left.amountCents);
}
