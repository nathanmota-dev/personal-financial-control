"use client";
import { DatabaseSyncContext } from "@/lib/database-sync-context";
import { useDatabaseSynchronization } from "@/hooks/use-database-synchronization";
import type { DatabaseSyncProps } from "@/lib/interfaces/database-replica";

export function DatabaseSyncProvider({ initialStatus, children }: DatabaseSyncProps) {
  const value = useDatabaseSynchronization(initialStatus);
  return <DatabaseSyncContext.Provider value={value}>{children}</DatabaseSyncContext.Provider>;
}
