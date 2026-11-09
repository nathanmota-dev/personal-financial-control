import type { creditCardCharges, transactions } from "@/lib/db/schema";
import type { PluggyCategoryRuleDirection } from "@/lib/interfaces/pluggy-category-rules";
import type { TransactionDb } from "@/lib/server/transactions/validation";
import { applyRuleToPendingRecords, isPluggyImported, isRuleDirection, upsertCategoryRule, usableRuleCategory } from "./category-rules";
import { normalizeDescription } from "./normalize-description";

type LearnableRecord = { importFingerprint: string | null; categoryId: string | null; description: string };
type TransactionRow = typeof transactions.$inferSelect;
type ChargeRow = typeof creditCardCharges.$inferSelect;

/** Keys on the previous description because a later sync brings the bank's text, not an edit made alongside the category. */
async function learn(db: TransactionDb, previous: LearnableRecord, categoryId: string | null, direction: PluggyCategoryRuleDirection) {
  if (!isPluggyImported(previous.importFingerprint) || !categoryId || categoryId === previous.categoryId) return;
  if (!await usableRuleCategory(db, categoryId, direction)) return;
  const rule = { normalizedDescription: normalizeDescription(previous.description), direction, categoryId };
  await upsertCategoryRule(db, rule);
  await applyRuleToPendingRecords(db, rule);
}

/** Runs inside the caller's database transaction, so a failed rule write also undoes the category change. */
export async function learnFromTransactionUpdate(db: TransactionDb, previous: TransactionRow, updated: TransactionRow) {
  if (isRuleDirection(updated.type)) await learn(db, previous, updated.categoryId, updated.type);
}

export async function learnFromChargeUpdate(db: TransactionDb, previous: ChargeRow, updated: ChargeRow) {
  await learn(db, previous, updated.categoryId, "expense");
}
