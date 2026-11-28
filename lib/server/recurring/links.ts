import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { recurringOccurrenceLinks, transactions } from "@/lib/db/schema";
import type { RecurringLinkCandidatesResult, SaveRecurringLinksInput } from "@/lib/interfaces/recurring-occurrences";
import { isCompatibleCandidate, isStrongMatch, scoreCandidate } from "@/lib/recurring-matching";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeCompetenceMonth } from "@/lib/server/finance";
import { linkEntryId, listOccurrenceLinks, listRecurringMatchCandidates } from "./candidates";
import { getRecurringTemplateById } from "./templates";
import { resolveDb } from "./validation";

const MAX_UNLINKED_CANDIDATES = 60;

const saveRecurringLinksSchema = z.object({
  templateId: z.string().uuid(),
  month: z.string().transform(normalizeCompetenceMonth),
  transactionIds: z.array(z.string().uuid()).max(50),
  chargeIds: z.array(z.string().uuid()).max(50),
});

/** Entries of the month that may pay the rule: the ones linked to it first, then the closest ones. */
export async function listRecurringLinkCandidates(templateId: string, month: string, database?: AppDb): Promise<RecurringLinkCandidatesResult> {
  const db = await resolveDb(database);
  const competenceMonth = normalizeCompetenceMonth(month);
  const template = await getRecurringTemplateById(templateId, db);
  const [links, entries, generated] = await Promise.all([
    listOccurrenceLinks(db),
    listRecurringMatchCandidates(db, competenceMonth),
    db.query.transactions.findMany({
      where: and(eq(transactions.recurringTemplateId, template.id), eq(transactions.competenceMonth, competenceMonth)),
      with: { account: true },
    }),
  ]);
  const active = links.filter((link) => link.kind !== "dismissed");
  const linked = new Set(active.filter((link) => link.recurringTemplateId === template.id && link.competenceMonth === competenceMonth).map(linkEntryId));
  const takenElsewhere = new Set(active.map(linkEntryId).filter((id) => !linked.has(id)));
  const scores = new Map(entries.map((entry) => [entry.id, scoreCandidate(template, entry, competenceMonth)]));
  const ranked = entries
    .filter((entry) => isCompatibleCandidate(template, entry) && !takenElsewhere.has(entry.id))
    .map((entry) => ({ ...entry, isLinked: linked.has(entry.id), isSuggested: isStrongMatch(template, entry, competenceMonth) }))
    .sort((left, right) => scores.get(right.id)! - scores.get(left.id)! || left.date.localeCompare(right.date));
  const candidates = [...ranked.filter((entry) => entry.isLinked), ...ranked.filter((entry) => !entry.isLinked).slice(0, MAX_UNLINKED_CANDIDATES)];

  return {
    generated: generated
      .filter((row) => row.status !== "cancelled")
      .map((row) => ({ id: row.id, kind: "transaction", source: "generated", description: row.description, date: row.transactionDate, amountCents: row.amountCents, accountName: row.account?.name ?? null })),
    candidates,
  };
}

/**
 * Replaces the entries linked to the rule in `month`. A new entry is a manual link; an automatic link the user removes
 * becomes `dismissed`, so it is not linked again, and a manual one is deleted.
 */
export async function saveRecurringLinks(input: SaveRecurringLinksInput, database?: AppDb) {
  const db = await resolveDb(database);
  const { templateId, month, transactionIds, chargeIds } = saveRecurringLinksSchema.parse(input);
  const { candidates } = await listRecurringLinkCandidates(templateId, month, db);
  const allowed = new Map(candidates.map((candidate) => [candidate.id, candidate.kind]));
  const requested = new Map([
    ...transactionIds.map((id) => [id, "transaction"] as const),
    ...chargeIds.map((id) => [id, "card"] as const),
  ]);
  for (const [id, kind] of requested) {
    invariant(allowed.get(id) === kind, "RECURRING_LINK_INVALID", "Este lançamento não pode ser vinculado a esta recorrência.");
  }
  const existing = (await listOccurrenceLinks(db)).filter((link) => link.recurringTemplateId === templateId && link.competenceMonth === month);
  const byEntry = new Map(existing.map((link) => [linkEntryId(link), link]));
  const now = currentTimestamp();

  await db.transaction(async (tx) => {
    const removed = existing.filter((link) => link.kind !== "dismissed" && !requested.has(linkEntryId(link)));
    const toDismiss = removed.filter((link) => link.kind === "auto").map((link) => link.id);
    const toDelete = removed.filter((link) => link.kind === "manual").map((link) => link.id);
    const restored = existing.filter((link) => link.kind === "dismissed" && requested.has(linkEntryId(link))).map((link) => link.id);
    if (toDismiss.length) await tx.update(recurringOccurrenceLinks).set({ kind: "dismissed", updatedAt: now }).where(inArray(recurringOccurrenceLinks.id, toDismiss));
    if (toDelete.length) await tx.delete(recurringOccurrenceLinks).where(inArray(recurringOccurrenceLinks.id, toDelete));
    if (restored.length) await tx.update(recurringOccurrenceLinks).set({ kind: "manual", updatedAt: now }).where(inArray(recurringOccurrenceLinks.id, restored));
    const added = [...requested].filter(([id]) => !byEntry.has(id));
    if (added.length) {
      await tx.insert(recurringOccurrenceLinks).values(added.map(([id, kind]) => ({
        recurringTemplateId: templateId,
        competenceMonth: month,
        transactionId: kind === "transaction" ? id : null,
        creditCardChargeId: kind === "card" ? id : null,
        kind: "manual" as const,
        updatedAt: now,
      })));
    }
  });
}
