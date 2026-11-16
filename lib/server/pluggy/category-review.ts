import type { AppDb } from "@/lib/db";
import type { AiPendingGroup } from "@/lib/interfaces/ai-categorization";
import type { PluggyPendingCategoryGroup, PluggyPendingRecord } from "@/lib/interfaces/pluggy-category-rules";
import { invariant } from "@/lib/server/errors";
import type { TransactionDb } from "@/lib/server/transactions/validation";
import { applyRuleToPendingRecords, categoryFitsDirection, findPendingRecords, upsertCategoryRule, usableRuleCategory } from "./category-rules";
import { suggestionKey, suggestionViews } from "./category-suggestions";
import type { PluggyCategoryRuleInput } from "./inputs";

type GroupDraft = PluggyPendingCategoryGroup & { sampleDescription: string };

function compareGroups(left: PluggyPendingCategoryGroup, right: PluggyPendingCategoryGroup) {
  return Math.abs(right.totalCents) - Math.abs(left.totalCents) || left.normalizedDescription.localeCompare(right.normalizedDescription) || left.direction.localeCompare(right.direction);
}

function groupPendingRecords(records: PluggyPendingRecord[]) {
  const groups = new Map<string, GroupDraft>();
  for (const record of records) {
    if (record.isCancelled) continue;
    const key = suggestionKey(record);
    const group = groups.get(key) ?? { normalizedDescription: record.normalizedDescription, direction: record.direction, occurrences: 0, totalCents: 0, sampleDescription: record.description };
    group.occurrences += 1;
    group.totalCents += record.amountCents;
    groups.set(key, group);
  }
  return [...groups.values()].sort(compareGroups);
}

/** Pending groups in the shape AI categorization sends: no amounts, one raw description as a sample. */
export async function listPendingGroupsForAi(db: TransactionDb): Promise<AiPendingGroup[]> {
  return groupPendingRecords(await findPendingRecords(db)).map(({ normalizedDescription, direction, sampleDescription, occurrences }) => ({ normalizedDescription, direction, sampleDescription, occurrences }));
}

/** A suggestion is shown only while its category can still take this direction. */
export async function listPendingCategoryGroups(db: AppDb): Promise<PluggyPendingCategoryGroup[]> {
  const [records, suggestions, categories] = await Promise.all([findPendingRecords(db), suggestionViews(db), db.query.categories.findMany()]);
  const byId = new Map(categories.map((category) => [category.id, category]));
  return groupPendingRecords(records).map(({ normalizedDescription, direction, occurrences, totalCents }) => {
    const group: PluggyPendingCategoryGroup = { normalizedDescription, direction, occurrences, totalCents };
    const suggestion = suggestions.get(suggestionKey(group));
    const category = suggestion ? byId.get(suggestion.categoryId) : undefined;
    return category && categoryFitsDirection(category, group.direction) ? { ...group, suggestion } : group;
  });
}

export async function applyPendingCategory(input: PluggyCategoryRuleInput, db: AppDb) {
  const applied = await db.transaction(async (tx) => {
    invariant(await usableRuleCategory(tx, input.categoryId, input.direction), "PLUGGY_CATEGORY_RULE_INVALID", "Escolha uma categoria ativa compatível com este lançamento.");
    await upsertCategoryRule(tx, input);
    return applyRuleToPendingRecords(tx, input);
  });
  return { applied, pending: await listPendingCategoryGroups(db) };
}
