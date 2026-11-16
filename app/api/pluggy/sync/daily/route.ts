import { after } from "next/server";

import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient, isPluggyConfigured } from "@/lib/server/pluggy/config";
import { runDailyPluggySync } from "@/lib/server/pluggy/daily-sync";
import { pluggyResponse, rejectPluggyMethod } from "@/lib/server/pluggy/route";
import { privateRoute } from "@/lib/server/route-response";

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const result = await runDailyPluggySync({ db: await getFinanceDatabase(), client: getPluggyClient, configured: isPluggyConfigured(), defer: after });
    return Response.json({ ok: true, ...result });
  });
}

export const POST = privateRoute(handlePOST);

export const HEAD = rejectPluggyMethod;

export const OPTIONS = rejectPluggyMethod;
