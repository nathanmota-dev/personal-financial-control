import type { AppDb } from "@/lib/db";
import type { PluggyPendingCategoryGroup } from "@/lib/interfaces/pluggy-category-rules";
import { invariant } from "@/lib/server/errors";
import { applyRuleToPendingRecords, findPendingRecords, upsertCategoryRule, usableRuleCategory } from "./category-rules";
import type { PluggyCategoryRuleInput } from "./inputs";

function compareGroups(left: PluggyPendingCategoryGroup, right: PluggyPendingCategoryGroup) {
  return Math.abs(right.totalCents) - Math.abs(left.totalCents) || left.normalizedDescription.localeCompare(right.normalizedDescription) || left.direction.localeCompare(right.direction);
}

export async function listPendingCategoryGroups(db: AppDb) {
  const groups = new Map<string, PluggyPendingCategoryGroup>();
  for (const record of await findPendingRecords(db)) {
    if (record.isCancelled) continue;
    const key = `${record.direction}:${record.normalizedDescription}`;
    const group = groups.get(key) ?? { normalizedDescription: record.normalizedDescription, direction: record.direction, occurrences: 0, totalCents: 0 };
    group.occurrences += 1;
    group.totalCents += record.amountCents;
    groups.set(key, group);
  }
  return [...groups.values()].sort(compareGroups);
}

export async function applyPendingCategory(input: PluggyCategoryRuleInput, db: AppDb) {
  const applied = await db.transaction(async (tx) => {
    invariant(await usableRuleCategory(tx, input.categoryId, input.direction), "PLUGGY_CATEGORY_RULE_INVALID", "Escolha uma categoria ativa compatível com este lançamento.");
    await upsertCategoryRule(tx, input);
    return applyRuleToPendingRecords(tx, input);
  });
  return { applied, pending: await listPendingCategoryGroups(db) };
}
