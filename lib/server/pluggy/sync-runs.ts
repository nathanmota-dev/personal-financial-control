import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { pluggySyncRuns } from "@/lib/db/schema";
import type { PluggyLatestRun, PluggySyncRunStatus, PluggySyncRunView, PluggySyncSummary } from "@/lib/interfaces/pluggy";
import { pluggyDayOf } from "@/lib/pluggy-ui";
import { pluggyRuntime } from "./config";

type RunRow = typeof pluggySyncRuns.$inferSelect;

function runView(row: RunRow): PluggySyncRunView {
  return {
    id: row.id,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
    status: row.status,
    errorCode: row.errorCode ?? null,
    summary: row.summary ? JSON.parse(row.summary) as PluggySyncSummary : null,
  };
}

/** The per-process guard is free here, so any row still marked running was orphaned by a crash. */
export async function openPluggyRun(db: AppDb, startedAt: Date) {
  await db.update(pluggySyncRuns)
    .set({ status: "failed", errorCode: "PLUGGY_SYNC_INTERRUPTED", finishedAt: startedAt, updatedAt: startedAt })
    .where(eq(pluggySyncRuns.status, "running"));
  const [row] = await db.insert(pluggySyncRuns).values({ startedAt, status: "running" }).returning();
  return row.id;
}

export async function closePluggyRun(db: AppDb, id: string, status: PluggySyncRunStatus, summary: PluggySyncSummary, errorCode: string | null) {
  const finishedAt = new Date();
  const [row] = await db.update(pluggySyncRuns)
    .set({ status, finishedAt, errorCode, summary: JSON.stringify(summary), updatedAt: finishedAt })
    .where(eq(pluggySyncRuns.id, id))
    .returning();
  return runView(row);
}

/** `started_at` is encrypted, so SQL cannot order it; the table holds about one row per day. */
async function listPluggyRuns(db: AppDb) {
  const rows = await db.query.pluggySyncRuns.findMany();
  return rows.sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime());
}

export async function getLatestPluggyRun(db: AppDb): Promise<PluggyLatestRun> {
  const [row] = await listPluggyRuns(db);
  return { run: row ? runView(row) : null, running: pluggyRuntime().syncRunning };
}

/** A failed run imported nothing, so it does not count as the day's sync. */
export async function hasCompletedPluggyRunOn(db: AppDb, day: string) {
  const rows = await listPluggyRuns(db);
  return rows.some((row) => (row.status === "success" || row.status === "partial") && pluggyDayOf(row.startedAt) === day);
}
