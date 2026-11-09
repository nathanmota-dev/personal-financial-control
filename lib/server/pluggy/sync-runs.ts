import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { pluggySyncRuns } from "@/lib/db/schema";
import type { PluggyLatestRun, PluggySyncRunStatus, PluggySyncRunView, PluggySyncSummary } from "@/lib/interfaces/pluggy";
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

export async function getLatestPluggyRun(db: AppDb): Promise<PluggyLatestRun> {
  const row = await db.query.pluggySyncRuns.findFirst({ orderBy: (table, { desc }) => [desc(table.startedAt)] });
  return { run: row ? runView(row) : null, running: pluggyRuntime().syncRunning };
}
