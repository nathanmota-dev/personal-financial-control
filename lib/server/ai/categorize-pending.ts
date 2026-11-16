import type { AiCategorizationCounts, AiCategoryExample, AiCategoryOption, CategorySuggester } from "@/lib/interfaces/ai-categorization";
import { listPendingGroupsForAi } from "@/lib/server/pluggy/category-review";
import { categoryFitsDirection } from "@/lib/server/pluggy/category-rules";
import { loadSuggestionIndex, saveCategorySuggestions, suggestionKey } from "@/lib/server/pluggy/category-suggestions";
import type { TransactionDb } from "@/lib/server/transactions/validation";

/** Keeps the prompt bounded for a long history; the most recently confirmed rules come first. */
const MAX_EXAMPLES = 300;

const fitsAnyDirection = (category: Parameters<typeof categoryFitsDirection>[0]) => categoryFitsDirection(category, "income") || categoryFitsDirection(category, "expense");

async function loadCategoryOptions(db: TransactionDb): Promise<AiCategoryOption[]> {
  const rows = await db.query.categories.findMany();
  return rows.filter(fitsAnyDirection).map(({ id, name, group, description }) => ({ id, name, group, description: description ?? null }));
}

async function loadExamples(db: TransactionDb, options: AiCategoryOption[]): Promise<AiCategoryExample[]> {
  const byId = new Map(options.map((option) => [option.id, option]));
  const rules = await db.query.pluggyCategoryRules.findMany();
  return rules
    .filter((rule) => {
      const category = byId.get(rule.categoryId);
      return category && categoryFitsDirection({ ...category, isArchived: false }, rule.direction);
    })
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, MAX_EXAMPLES)
    .map(({ normalizedDescription, direction, categoryId }) => ({ normalizedDescription, direction, categoryId }));
}

/**
 * Asks the AI only about pending descriptions it was never asked about, and stores every answer,
 * including "unknown", so the same description is not sent again on the next sync.
 */
export async function suggestPendingCategories(db: TransactionDb, suggester: CategorySuggester): Promise<AiCategorizationCounts> {
  const [groups, asked] = await Promise.all([listPendingGroupsForAi(db), loadSuggestionIndex(db)]);
  const pending = groups.filter((group) => !asked.has(suggestionKey(group)));
  if (!pending.length) return { aiAttempted: 0, aiSuggested: 0 };
  const categories = await loadCategoryOptions(db);
  if (!categories.length) return { aiAttempted: 0, aiSuggested: 0 };
  const examples = await loadExamples(db, categories);
  const suggestions = await suggester.suggest({ categories, examples, pending });
  await saveCategorySuggestions(db, suggestions);
  return { aiAttempted: suggestions.length, aiSuggested: suggestions.filter((suggestion) => suggestion.categoryId).length };
}
