import "server-only";

import { type AppDb, getFinanceDatabase } from "@/lib/db";
import { createFeatureRoute } from "@/lib/server/feature-route";

const route = createFeatureRoute({ invalid: "INVALID_AI_REQUEST", internal: "AI_INTERNAL_ERROR" });

/** Runs after `apiGuard` in each handler: demo isolation first, then safe error mapping. */
export const aiResponse = route.respond;

export const rejectAiMethod = route.rejectMethod;

/** Runs after `apiGuard`: hands the JSON body and the database to `action`, with the same safe error mapping. */
export function aiJsonResponse(action: (body: unknown, db: AppDb) => Promise<Response>, request: Request) {
  return aiResponse(async () => action(await request.json(), await getFinanceDatabase()));
}
