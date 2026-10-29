"use client";
import { createContext, useContext } from "react";
import type { DatabaseSyncContextValue } from "@/lib/interfaces/database-replica";

export const DatabaseSyncContext = createContext<DatabaseSyncContextValue>({
  status: null, canWrite: true, synchronize: async () => {},
});
export function useDatabaseSync() { return useContext(DatabaseSyncContext); }
