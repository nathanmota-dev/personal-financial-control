import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { recurringOccurrenceLinks, recurringTemplates } from "@/lib/db/schema";
import { findAutoLinks } from "@/lib/recurring-matching";
import { currentTimestamp } from "@/lib/server/finance";
import { addMonthsToMonth } from "@/lib/utils/finance-month";
import { linkEntryId, listOccurrenceLinks, listRecurringMatchCandidates } from "./candidates";
import { listRecordedOccurrenceKeys } from "./occurrences";
import { resolveDb } from "./validation";

function isScheduledIn(template: typeof recurringTemplates.$inferSelect, month: string) {
  return template.startMonth <= month && (!template.endMonth || template.endMonth >= month);
}

/** Links each rule of `months` still without an occurrence to its single unambiguous entry. Running it again changes nothing. */
export async function autoLinkRecurringOccurrences(months: string[], database?: AppDb) {
  const db = await resolveDb(database);
  const templates = await db.query.recurringTemplates.findMany({ where: eq(recurringTemplates.status, "active") });
  if (!templates.length) return [];
  const links = await listOccurrenceLinks(db);
  const created: (typeof recurringOccurrenceLinks.$inferSelect)[] = [];

  for (const month of [...new Set(months)].sort()) {
    const scheduled = templates.filter((template) => isScheduledIn(template, month));
    const recorded = await listRecordedOccurrenceKeys(db, scheduled.map((template) => template.id), { startMonth: month, endMonth: month });
    const pending = scheduled.filter((template) => !recorded.has(`${template.id}:${month}`));
    if (!pending.length) continue;
    const taken = new Set(links.filter((link) => link.kind !== "dismissed").map(linkEntryId));
    const dismissed = new Set(links.filter((link) => link.kind === "dismissed").map((link) => `${link.recurringTemplateId}:${linkEntryId(link)}`));
    const candidates = (await listRecurringMatchCandidates(db, month)).filter((candidate) => !taken.has(candidate.id));
    const matches = findAutoLinks({ month, templates: pending, candidates, dismissed });
    if (!matches.length) continue;
    const rows = await db
      .insert(recurringOccurrenceLinks)
      .values(matches.map(({ templateId, candidate }) => ({
        recurringTemplateId: templateId,
        competenceMonth: month,
        transactionId: candidate.kind === "transaction" ? candidate.id : null,
        creditCardChargeId: candidate.kind === "card" ? candidate.id : null,
        kind: "auto" as const,
        updatedAt: currentTimestamp(),
      })))
      .returning();
    links.push(...rows);
    created.push(...rows);
  }

  return created;
}

/** After an import: the current month and the previous one, whose entries the bank may still be posting. */
export async function autoLinkRecentRecurringOccurrences(today: string, database?: AppDb) {
  const month = today.slice(0, 7);
  return autoLinkRecurringOccurrences([addMonthsToMonth(month, -1), month], database);
}
