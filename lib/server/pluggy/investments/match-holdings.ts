import type { PluggyLocalHolding, PluggyMappedInvestment } from "@/lib/interfaces/pluggy-investments";

export const PLUGGY_PROVIDER = "pluggy";

const TICKER_SCORE = 4;

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/\s+/g, " ").trim();
}

function overlaps(left: string, right: string) {
  return left.includes(right) || right.includes(left);
}

/** Columns are encrypted without a lookup hash, so links are resolved in memory. The stored identifier is only `id`. */
export function linkedHoldingsByAsset(holdings: PluggyLocalHolding[]) {
  return new Map(holdings.flatMap((holding) => holding.externalProvider === PLUGGY_PROVIDER && holding.externalAssetId ? [[holding.externalAssetId, holding] as const] : []));
}

/** A code shared by several positions identifies none of them: one bank repeats a single `code` on every position. */
export function uniqueMatchCodes(positions: PluggyMappedInvestment[]) {
  const seen = new Map<string, number>();
  for (const code of positions.flatMap((position) => position.matchCodes)) seen.set(code, (seen.get(code) ?? 0) + 1);
  return new Set([...seen].flatMap(([code, total]) => total === 1 ? [code] : []));
}

function holdingScore(position: PluggyMappedInvestment, holding: PluggyLocalHolding, uniqueCodes: Set<string>) {
  const ticker = holding.ticker ? normalize(holding.ticker) : null;
  if (ticker && position.matchCodes.some((code) => uniqueCodes.has(code) && normalize(code) === ticker)) return TICKER_SCORE;
  const remoteName = normalize(position.name);
  const localName = normalize(holding.name);
  if (!overlaps(remoteName, localName)) return 0;
  const sameInstitution = Boolean(position.institutionName && holding.institutionName && overlaps(normalize(position.institutionName), normalize(holding.institutionName)));
  return (remoteName === localName ? 2 : 1) + (sameInstitution ? 1 : 0);
}

/** A tie suggests nothing, so the user is never shown an arbitrary pick. */
export function suggestHolding(position: PluggyMappedInvestment, candidates: PluggyLocalHolding[], uniqueCodes: Set<string>) {
  const scored = candidates.map((holding) => ({ holding, score: holdingScore(position, holding, uniqueCodes) }));
  const best = Math.max(0, ...scored.map((entry) => entry.score));
  const leaders = scored.filter((entry) => entry.score === best);
  return best > 0 && leaders.length === 1 ? leaders[0].holding : null;
}
