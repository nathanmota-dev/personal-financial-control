import "server-only";

import { getServerEnv } from "@/lib/env";
import type { PluggyApi, PluggyRuntime, PluggyRuntimeGlobal } from "@/lib/interfaces/pluggy";
import { PluggyClient } from "./client";
import { pluggyNotConfigured } from "./errors";

// Next.js loads separate module instances per route, but the key cache and the sync guard are per process.
export function pluggyRuntime(): PluggyRuntime {
  const shared = globalThis as PluggyRuntimeGlobal;
  shared.__pfcPluggy ??= { syncRunning: false };
  return shared.__pfcPluggy;
}

function pluggyCredentials() {
  const { PLUGGY_CLIENT_ID: clientId, PLUGGY_CLIENT_SECRET: clientSecret } = getServerEnv();
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

export function isPluggyConfigured() {
  return pluggyCredentials() !== undefined;
}

export function getPluggyClient(): PluggyApi {
  const credentials = pluggyCredentials();
  if (!credentials) throw pluggyNotConfigured();
  const runtime = pluggyRuntime();
  runtime.client ??= new PluggyClient(credentials);
  return runtime.client;
}
