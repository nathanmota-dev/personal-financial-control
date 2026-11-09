import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { getPluggyClient } from "@/lib/server/pluggy/config";
import { pluggyLinkInputSchema, pluggyLinkUpdateSchema } from "@/lib/server/pluggy/inputs";
import { createPluggyLink, listPluggyLinks, updatePluggyLink } from "@/lib/server/pluggy/links";
import { pluggyResponse, rejectPluggyMethod } from "@/lib/server/pluggy/route";
import { privateRoute } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => Response.json({ ok: true, links: await listPluggyLinks(await getFinanceDatabase()) }));
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const input = pluggyLinkInputSchema.parse(await request.json());
    const link = await createPluggyLink(input, await getFinanceDatabase(), getPluggyClient());
    return Response.json({ ok: true, link }, { status: 201 });
  });
}

async function handlePATCH(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const input = pluggyLinkUpdateSchema.parse(await request.json());
    return Response.json({ ok: true, link: await updatePluggyLink(input, await getFinanceDatabase()) });
  });
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const PATCH = privateRoute(handlePATCH);

export const HEAD = rejectPluggyMethod;

export const OPTIONS = rejectPluggyMethod;
