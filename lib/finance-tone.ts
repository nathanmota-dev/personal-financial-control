import type { Tone } from "@/lib/interfaces/design-system";

const PALETTE: Tone[] = ["1", "2", "3", "4", "5", "6", "7", "8"];

/** Stable categorical tone for a user-defined label (category, account, asset). */
export function toneForKey(key: string | null | undefined): Tone {
  if (!key) return "neutral";
  let hash = 2166136261;
  for (const character of key.trim().toLowerCase()) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  hash = (hash ^ (hash >>> 15)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function toneClass(tone: Tone = "neutral") {
  return `tone-${tone}`;
}

const TYPE_TONES: Record<string, Tone> = {
  income: "success",
  expense: "danger",
  investment_contribution: "violet",
  investment_withdrawal: "warning",
  transfer: "brand",
};

export function toneForTransactionType(type: string): Tone {
  return TYPE_TONES[type] ?? "neutral";
}

const STATUS_TONES: Record<string, Tone> = {
  posted: "success",
  pending: "warning",
  cancelled: "neutral",
};

export function toneForStatus(status: string): Tone {
  return STATUS_TONES[status] ?? "neutral";
}

/** Clamp a ratio into a 0–100 percentage safe for bars and rings. */
export function toPercent(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}

/** Group rows by a date key while preserving the incoming order. */
export function groupByDate<Row>(rows: Row[], getDate: (row: Row) => string) {
  const groups: { date: string; rows: Row[] }[] = [];
  for (const row of rows) {
    const date = getDate(row);
    const last = groups[groups.length - 1];
    if (last && last.date === date) last.rows.push(row);
    else groups.push({ date, rows: [row] });
  }
  return groups;
}

/** Rank labelled amounts and express each as a share of the total. */
export function rankShares<Row>(rows: Row[], getName: (row: Row) => string | null, getAmount: (row: Row) => number, limit = 4) {
  const totals = new Map<string | null, number>();
  for (const row of rows) totals.set(getName(row), (totals.get(getName(row)) ?? 0) + getAmount(row));
  const total = [...totals.values()].reduce((sum, amount) => sum + amount, 0);
  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([name, amountCents]) => ({ name, amountCents, percent: toPercent(amountCents, total) }));
}

const ASSET_CLASS_TONES: Record<string, Tone> = {
  fixed_income: "1",
  equities: "5",
  funds: "2",
  real_estate: "6",
  crypto: "4",
  cash: "7",
  other: "neutral",
};

export function toneForAssetClass(assetClass: string): Tone {
  return ASSET_CLASS_TONES[assetClass] ?? "neutral";
}
