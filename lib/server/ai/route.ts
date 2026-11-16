import "server-only";

import { createFeatureRoute } from "@/lib/server/feature-route";

const route = createFeatureRoute({ invalid: "INVALID_AI_REQUEST", internal: "AI_INTERNAL_ERROR" });

/** Runs after `apiGuard` in each handler: demo isolation first, then safe error mapping. */
export const aiResponse = route.respond;

export const rejectAiMethod = route.rejectMethod;
