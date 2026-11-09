import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { pluggyIdentityInputSchema } from "@/lib/server/pluggy/inputs";
import { getPluggyIdentity, savePluggyIdentity } from "@/lib/server/pluggy/own-identity";
import { pluggyResponse, rejectPluggyMethod } from "@/lib/server/pluggy/route";
import { privateRoute } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => Response.json({ ok: true, identity: await getPluggyIdentity(await getFinanceDatabase()) }));
}

async function handlePUT(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const input = pluggyIdentityInputSchema.parse(await request.json());
    return Response.json({ ok: true, identity: await savePluggyIdentity(input, await getFinanceDatabase()) });
  });
}

export const GET = privateRoute(handleGET);

export const PUT = privateRoute(handlePUT);

export const HEAD = rejectPluggyMethod;

export const OPTIONS = rejectPluggyMethod;
