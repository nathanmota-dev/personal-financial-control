import "server-only";

import { createFeatureRoute } from "@/lib/server/feature-route";

const route = createFeatureRoute({ invalid: "INVALID_PLUGGY_REQUEST", internal: "PLUGGY_INTERNAL_ERROR" });

/** Runs after `apiGuard` in each handler: demo isolation first, then safe error mapping. */
export const pluggyResponse = route.respond;

export const rejectPluggyMethod = route.rejectMethod;
