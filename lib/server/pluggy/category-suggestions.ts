import { pluggyCategorySuggestions } from "@/lib/db/schema";
import type { AiCategorySuggestion } from "@/lib/interfaces/ai-categorization";
import type { PluggyCategoryRuleTarget, PluggyCategorySuggestionView } from "@/lib/interfaces/pluggy-category-rules";
import { currentTimestamp } from "@/lib/server/finance";
import type { TransactionDb } from "@/lib/server/transactions/validation";

export const suggestionKey = ({ direction, normalizedDescription }: PluggyCategoryRuleTarget) => `${direction}:${normalizedDescription}`;

/** Every description the AI was already asked about, including the ones it could not tell. */
export async function loadSuggestionIndex(db: TransactionDb) {
  const rows = await db.query.pluggyCategorySuggestions.findMany();
  return new Map(rows.map((row) => [suggestionKey(row), row]));
}

export async function suggestionViews(db: TransactionDb): Promise<Map<string, PluggyCategorySuggestionView>> {
  const views = new Map<string, PluggyCategorySuggestionView>();
  for (const [key, row] of await loadSuggestionIndex(db)) {
    if (row.categoryId) views.set(key, { categoryId: row.categoryId, reason: row.reason ?? null });
  }
  return views;
}

/** Confidence is stored as a whole percentage, the precision an integer column keeps. */
export async function saveCategorySuggestions(db: TransactionDb, suggestions: AiCategorySuggestion[]) {
  if (!suggestions.length) return;
  const updatedAt = currentTimestamp();
  await db.insert(pluggyCategorySuggestions).values(suggestions.map((suggestion) => ({
    normalizedDescription: suggestion.normalizedDescription,
    direction: suggestion.direction,
    categoryId: suggestion.categoryId,
    reason: suggestion.reason,
    confidence: Math.round(suggestion.confidence * 100),
    updatedAt,
  }))).onConflictDoNothing();
}
