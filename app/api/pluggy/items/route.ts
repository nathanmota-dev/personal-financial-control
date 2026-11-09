import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient } from "@/lib/server/pluggy/config";
import { pluggyItemIdSchema, pluggyItemInputSchema } from "@/lib/server/pluggy/inputs";
import { addPluggyItem, getPluggyOverview, removePluggyItem } from "@/lib/server/pluggy/items";
import { pluggyResponse, rejectPluggyMethod } from "@/lib/server/pluggy/route";
import { privateRoute } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => Response.json({ ok: true, ...(await getPluggyOverview(await getFinanceDatabase(), getPluggyClient())) }));
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const input = pluggyItemInputSchema.parse(await request.json());
    const item = await addPluggyItem(input, await getFinanceDatabase(), getPluggyClient());
    return Response.json({ ok: true, item }, { status: 201 });
  });
}

async function handleDELETE(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const id = pluggyItemIdSchema.parse(new URL(request.url).searchParams.get("id"));
    await removePluggyItem(id, await getFinanceDatabase());
    return Response.json({ ok: true });
  });
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const DELETE = privateRoute(handleDELETE);

export const HEAD = rejectPluggyMethod;

export const OPTIONS = rejectPluggyMethod;
