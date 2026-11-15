import type { PluggyDailySyncOptions, PluggyDailySyncResult } from "@/lib/interfaces/pluggy";
import { pluggyDayOf } from "@/lib/pluggy-ui";
import { pluggyRuntime } from "./config";
import { runPluggySync } from "./sync";
import { hasCompletedPluggyRunOn } from "./sync-runs";

/** MeuPluggy collects once a day, so the app reads it automatically at most once per day. */
export async function runDailyPluggySync({ db, client, configured, now = new Date() }: PluggyDailySyncOptions): Promise<PluggyDailySyncResult> {
  if (!configured) return { ran: false, reason: "not-configured" };
  if (!(await db.query.pluggyItems.findFirst())) return { ran: false, reason: "no-items" };
  if (await hasCompletedPluggyRunOn(db, pluggyDayOf(now))) return { ran: false, reason: "already-synced" };
  // Checked after the reads so a run started meanwhile is skipped instead of rejected.
  if (pluggyRuntime().syncRunning) return { ran: false, reason: "running" };
  return { ran: true, run: await runPluggySync({ db, client: client() }) };
}
