import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient } from "@/lib/server/pluggy/config";
import { pluggyInvestmentLinkInputSchema, pluggyItemIdSchema } from "@/lib/server/pluggy/inputs";
import { getPluggyInvestmentOverview, linkPluggyInvestment, unlinkPluggyInvestment } from "@/lib/server/pluggy/investments/links";
import { pluggyResponse, rejectPluggyMethod } from "@/lib/server/pluggy/route";
import { privateRoute } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => Response.json({ ok: true, ...await getPluggyInvestmentOverview(await getFinanceDatabase(), getPluggyClient()) }));
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const input = pluggyInvestmentLinkInputSchema.parse(await request.json());
    const [db, client] = [await getFinanceDatabase(), getPluggyClient()];
    await linkPluggyInvestment(input, db, client);
    return Response.json({ ok: true, ...await getPluggyInvestmentOverview(db, client) }, { status: 201 });
  });
}

async function handleDELETE(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const holdingId = pluggyItemIdSchema.parse(new URL(request.url).searchParams.get("holdingId"));
    const [db, client] = [await getFinanceDatabase(), getPluggyClient()];
    await unlinkPluggyInvestment(holdingId, db);
    return Response.json({ ok: true, ...await getPluggyInvestmentOverview(db, client) });
  });
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const DELETE = privateRoute(handleDELETE);

export const HEAD = rejectPluggyMethod;

export const OPTIONS = rejectPluggyMethod;
