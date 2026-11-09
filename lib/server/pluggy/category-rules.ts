import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { categories, creditCardCharges, pluggyCategoryRules, transactions } from "@/lib/db/schema";
import type { CategoryGroup } from "@/lib/db/schema";
import type {
  PluggyCategoryRuleDirection,
  PluggyCategoryRuleIndex,
  PluggyCategoryRuleTarget,
  PluggyCategoryRuleValues,
  PluggyPendingRecord,
} from "@/lib/interfaces/pluggy-category-rules";
import { isPendingCategory } from "@/lib/pending-category";
import { currentTimestamp } from "@/lib/server/finance";
import { findPendingCategory, getOrCreatePendingCategory } from "@/lib/server/pending-category";
import type { TransactionDb } from "@/lib/server/transactions/validation";
import { normalizeDescription } from "./normalize-description";

const ruleKey = ({ direction, normalizedDescription }: PluggyCategoryRuleTarget) => `${direction}:${normalizedDescription}`;

export function isPluggyImported(importFingerprint: string | null | undefined) {
  return Boolean(importFingerprint?.startsWith("pluggy:"));
}

export function isRuleDirection(type: string): type is PluggyCategoryRuleDirection {
  return type === "income" || type === "expense";
}

/** A rule's category can be archived or regrouped later; using it then would fail the import. */
export function categoryFitsDirection(category: { name: string; group: CategoryGroup; isArchived: boolean }, direction: PluggyCategoryRuleDirection) {
  if (category.isArchived || isPendingCategory(category)) return false;
  return direction === "income" ? category.group === "income" : category.group === "fixed_expense" || category.group === "variable_expense";
}

export async function loadCategoryRuleIndex(db: TransactionDb): Promise<PluggyCategoryRuleIndex> {
  const [rules, rows] = await Promise.all([db.query.pluggyCategoryRules.findMany(), db.query.categories.findMany()]);
  const byId = new Map(rows.map((category) => [category.id, category]));
  const usable = rules.filter((rule) => {
    const category = byId.get(rule.categoryId);
    return category && categoryFitsDirection(category, rule.direction);
  });
  return new Map(usable.map((rule) => [ruleKey(rule), rule.categoryId]));
}

export function resolveRuleCategory(index: PluggyCategoryRuleIndex, description: string, direction: PluggyCategoryRuleDirection) {
  return index.get(ruleKey({ direction, normalizedDescription: normalizeDescription(description) })) ?? null;
}

/** Card purchases cannot be left without a category, unlike bank transactions. */
export async function resolveCardCategoryId(db: TransactionDb, index: PluggyCategoryRuleIndex, description: string) {
  return resolveRuleCategory(index, description, "expense") ?? (await getOrCreatePendingCategory(db)).id;
}

export async function upsertCategoryRule(db: TransactionDb, { normalizedDescription, direction, categoryId }: PluggyCategoryRuleValues) {
  const existing = await db.query.pluggyCategoryRules.findFirst({
    where: and(eq(pluggyCategoryRules.normalizedDescription, normalizedDescription), eq(pluggyCategoryRules.direction, direction)),
  });
  const updatedAt = currentTimestamp();
  if (existing) await db.update(pluggyCategoryRules).set({ categoryId, updatedAt }).where(eq(pluggyCategoryRules.id, existing.id));
  else await db.insert(pluggyCategoryRules).values({ normalizedDescription, direction, categoryId, updatedAt });
}

/** Imported records still waiting for a category. Manually created records are never included. */
export async function findPendingRecords(db: TransactionDb): Promise<PluggyPendingRecord[]> {
  const pending = await findPendingCategory(db);
  const [bankRows, cardRows] = await Promise.all([
    db.query.transactions.findMany({ where: pending ? or(isNull(transactions.categoryId), eq(transactions.categoryId, pending.id)) : isNull(transactions.categoryId) }),
    pending ? db.query.creditCardCharges.findMany({ where: eq(creditCardCharges.categoryId, pending.id) }) : [],
  ]);
  const records: PluggyPendingRecord[] = [];
  for (const row of bankRows) {
    if (!isPluggyImported(row.importFingerprint) || !isRuleDirection(row.type)) continue;
    records.push({ table: "transactions", id: row.id, direction: row.type, normalizedDescription: normalizeDescription(row.description), amountCents: row.amountCents, isCancelled: row.status === "cancelled" });
  }
  for (const row of cardRows) {
    if (!isPluggyImported(row.importFingerprint)) continue;
    records.push({ table: "credit_card_charges", id: row.id, direction: "expense", normalizedDescription: normalizeDescription(row.description), amountCents: row.totalAmountCents, isCancelled: false });
  }
  return records;
}

/** Writes the category directly: a paid card bill blocks edits to amounts, not to how a purchase is classified. */
export async function applyRuleToPendingRecords(db: TransactionDb, rule: PluggyCategoryRuleValues) {
  const matches = (await findPendingRecords(db)).filter((record) => ruleKey(record) === ruleKey(rule));
  const idsOf = (table: PluggyPendingRecord["table"]) => matches.filter((record) => record.table === table).map((record) => record.id);
  const patch = { categoryId: rule.categoryId, updatedAt: currentTimestamp() };
  const [bankIds, cardIds] = [idsOf("transactions"), idsOf("credit_card_charges")];
  if (bankIds.length) await db.update(transactions).set(patch).where(inArray(transactions.id, bankIds));
  if (cardIds.length) await db.update(creditCardCharges).set(patch).where(inArray(creditCardCharges.id, cardIds));
  return matches.length;
}

export async function usableRuleCategory(db: TransactionDb, categoryId: string, direction: PluggyCategoryRuleDirection) {
  const category = await db.query.categories.findFirst({ where: eq(categories.id, categoryId) });
  return category && categoryFitsDirection(category, direction) ? category : null;
}
