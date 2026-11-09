import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient } from "@/lib/server/pluggy/config";
import { pluggySyncRequestSchema } from "@/lib/server/pluggy/inputs";
import { pluggyResponse, rejectPluggyMethod } from "@/lib/server/pluggy/route";
import { runPluggySync } from "@/lib/server/pluggy/sync";
import { getLatestPluggyRun } from "@/lib/server/pluggy/sync-runs";
import { privateRoute } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => Response.json({ ok: true, ...(await getLatestPluggyRun(await getFinanceDatabase())) }));
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const { dryRun } = pluggySyncRequestSchema.parse(await request.json());
    const run = await runPluggySync({ db: await getFinanceDatabase(), client: getPluggyClient(), dryRun });
    return Response.json({ ok: true, run });
  });
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectPluggyMethod;

export const OPTIONS = rejectPluggyMethod;
