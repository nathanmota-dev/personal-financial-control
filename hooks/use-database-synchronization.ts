"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DatabaseSyncStatus } from "@/lib/interfaces/database-replica";
import { resetRecurringGeneration } from "@/lib/recurring-generation-session";

export function useDatabaseSynchronization(initialStatus: DatabaseSyncStatus) {
  const [status, setStatus] = useState(initialStatus);
  const router = useRouter();
  const revision = useRef(initialStatus.revision);
  const pending = useRef<Promise<void> | null>(null);
  const mounted = useRef(false);
  const synchronize = useCallback(async (sync = true) => {
    if (initialStatus.mode !== "replica") return;
    if (pending.current) { await pending.current; if (!sync || !mounted.current) return; }
    if (sync) setStatus((previous) => ({ ...previous, state: "syncing" }));
    pending.current = (async () => {
      try {
        const response = await fetch("/api/database/sync", {
          method: sync ? "POST" : "GET", cache: "no-store",
          ...(sync ? { headers: { "Content-Type": "application/json" }, body: "{}" } : {}),
        });
        if (response.status === 401 || response.status === 423) { router.refresh(); return; }
        const body = await response.json();
        if (!body.status || body.status.mode !== "replica") throw new Error("Sync unavailable");
        if (!mounted.current) return;
        const next: DatabaseSyncStatus = body.status;
        setStatus(next);
        const editing = document.querySelector('[role="dialog"]') ||
          document.activeElement?.matches('input, textarea, select, [contenteditable="true"]');
        if (next.state === "ready" && next.revision !== revision.current && !editing) {
          revision.current = next.revision;
          resetRecurringGeneration();
          router.refresh();
        }
      } catch {
        if (mounted.current) setStatus((previous) => ({ ...previous, state: "unavailable" }));
      }
    })();
    try { await pending.current; } finally { pending.current = null; }
  }, [initialStatus.mode, router]);
  useEffect(() => {
    mounted.current = true;
    if (initialStatus.mode !== "replica") return () => { mounted.current = false; };
    const resume = () => { if (document.visibilityState === "visible") void synchronize(); };
    const poll = () => { if (document.visibilityState === "visible") void synchronize(false); };
    const timer = window.setInterval(poll, initialStatus.intervalSeconds * 1000);
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", resume);
      window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [initialStatus.mode, initialStatus.intervalSeconds, synchronize]);
  return { status, canWrite: status.mode !== "replica" || status.state === "ready", synchronize };
}
