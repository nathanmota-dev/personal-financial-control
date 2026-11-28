import { and, eq, inArray, type SQL } from "drizzle-orm";

import { recurringOccurrenceLinks, transactions } from "@/lib/db/schema";
import type { AppDb } from "@/lib/db";
import type { FinanceDatabase } from "@/lib/interfaces/database";
import type { RecurringMonthOccurrence, RecurringOccurrenceEntry, RecurringOccurrencesData } from "@/lib/interfaces/recurring-occurrences";
import { normalizeCompetenceMonth } from "@/lib/server/finance";
import { resolveDb } from "./validation";

type OccurrenceRange = { startMonth?: string; endMonth?: string; includeCancelledGenerated?: boolean };

function inRange(month: string, { startMonth, endMonth }: OccurrenceRange) {
  return (!startMonth || month >= startMonth) && (!endMonth || month <= endMonth);
}

/** Links that count as a payment: not undone, and whose entry was not cancelled. */
async function listActiveLinks(db: FinanceDatabase, where?: SQL) {
  const links = await db.query.recurringOccurrenceLinks.findMany({
    where,
    with: { transaction: { with: { account: true } }, charge: { with: { account: true } } },
  });
  return links.filter((link) => link.kind !== "dismissed" && (link.charge || (link.transaction && link.transaction.status !== "cancelled")));
}

/**
 * Every `templateId:month` that already happened: occurrences the app generated and links to real entries.
 * A cancelled generated occurrence still counts by default, so the projection does not bring back a month the user cancelled.
 */
export async function listRecordedOccurrenceKeys(db: FinanceDatabase, templateIds: string[], range: OccurrenceRange = {}) {
  if (!templateIds.length) return new Set<string>();
  const [generated, links] = await Promise.all([
    db.query.transactions.findMany({
      where: inArray(transactions.recurringTemplateId, templateIds),
      columns: { recurringTemplateId: true, competenceMonth: true, status: true },
    }),
    listActiveLinks(db, inArray(recurringOccurrenceLinks.recurringTemplateId, templateIds)),
  ]);
  const keys = [
    ...generated.filter((row) => range.includeCancelledGenerated !== false || row.status !== "cancelled").map((row) => ({ templateId: row.recurringTemplateId as string, month: row.competenceMonth })),
    ...links.map((link) => ({ templateId: link.recurringTemplateId, month: link.competenceMonth })),
  ];
  return new Set(keys.filter((key) => inRange(key.month, range)).map((key) => `${key.templateId}:${key.month}`));
}

function addEntry(byTemplate: Record<string, RecurringMonthOccurrence>, templateId: string, entry: RecurringOccurrenceEntry) {
  const occurrence = (byTemplate[templateId] ??= { templateId, entries: [], recordedCents: 0 });
  occurrence.entries.push(entry);
  occurrence.recordedCents += entry.amountCents;
}

/** What paid each rule in `month`, and every recorded `templateId:month` for the views that move between months. */
export async function listRecurringOccurrences(requestedMonth: string, database?: AppDb): Promise<RecurringOccurrencesData> {
  const db = await resolveDb(database);
  const month = normalizeCompetenceMonth(requestedMonth);
  const templateIds = (await db.query.recurringTemplates.findMany({ columns: { id: true } })).map((template) => template.id);
  const [generated, links, keys] = await Promise.all([
    db.query.transactions.findMany({ where: eq(transactions.competenceMonth, month), with: { account: true } }),
    listActiveLinks(db, eq(recurringOccurrenceLinks.competenceMonth, month)),
    listRecordedOccurrenceKeys(db, templateIds, { includeCancelledGenerated: false }),
  ]);
  const byTemplate: Record<string, RecurringMonthOccurrence> = {};
  for (const row of generated) {
    if (!row.recurringTemplateId || row.status === "cancelled") continue;
    addEntry(byTemplate, row.recurringTemplateId, { id: row.id, kind: "transaction", source: "generated", description: row.description, date: row.transactionDate, amountCents: row.amountCents, accountName: row.account?.name ?? null });
  }
  for (const link of links) {
    const source = link.kind as "auto" | "manual";
    const entry: RecurringOccurrenceEntry = link.charge
      ? { id: link.charge.id, kind: "card", source, description: link.charge.description, date: link.charge.purchaseDate, amountCents: link.charge.totalAmountCents, accountName: link.charge.account?.name ?? null }
      : { id: link.transaction!.id, kind: "transaction", source, description: link.transaction!.description, date: link.transaction!.transactionDate, amountCents: link.transaction!.amountCents, accountName: link.transaction!.account?.name ?? null };
    addEntry(byTemplate, link.recurringTemplateId, entry);
  }
  for (const occurrence of Object.values(byTemplate)) occurrence.entries.sort((left, right) => left.date.localeCompare(right.date));
  return { month, byTemplate, recordedKeys: [...keys].sort() };
}

/** Rules of `month` whose payment already happened: a posted generated occurrence or a linked entry that is posted or on the card. */
export async function listPaidRecurringTemplateIds(db: FinanceDatabase, month: string, templateIds: string[]) {
  if (!templateIds.length) return new Set<string>();
  const [generated, links] = await Promise.all([
    db.query.transactions.findMany({
      where: and(eq(transactions.competenceMonth, month), inArray(transactions.recurringTemplateId, templateIds)),
      columns: { recurringTemplateId: true, status: true },
    }),
    listActiveLinks(db, and(eq(recurringOccurrenceLinks.competenceMonth, month), inArray(recurringOccurrenceLinks.recurringTemplateId, templateIds))),
  ]);
  return new Set([
    ...generated.filter((row) => row.status === "posted").map((row) => row.recurringTemplateId as string),
    ...links.filter((link) => link.charge || link.transaction?.status === "posted").map((link) => link.recurringTemplateId),
  ]);
}
