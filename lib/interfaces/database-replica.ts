import type { Client } from "@libsql/client";
import type { ReactNode } from "react";

export interface DatabaseSyncStatus {
  mode: "replica" | "remote" | "local" | "demo";
  state: "ready" | "syncing" | "unavailable";
  lastSuccessfulSyncAt: string | null;
  revision: number;
  intervalSeconds: number;
}

export interface ReplicaRuntime {
  client: Client;
  status: () => DatabaseSyncStatus;
  sync: () => Promise<DatabaseSyncStatus>;
  close: () => void;
}

export interface ReplicaClientHooks {
  beforeWrite: () => Promise<void>;
  assertWritable: () => void;
  failed: () => void;
}

export interface DatabaseSyncProps {
  initialStatus: DatabaseSyncStatus;
  children: ReactNode;
}

export interface DatabaseSyncContextValue {
  status: DatabaseSyncStatus | null;
  canWrite: boolean;
  synchronize: () => Promise<void>;
}

export interface ReplicaGlobal {
  configuration: string;
  runtime: Promise<ReplicaRuntime>;
}
