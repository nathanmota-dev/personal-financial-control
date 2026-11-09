import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { applyPendingCategory, listPendingCategoryGroups } from "@/lib/server/pluggy/category-review";
import { pluggyCategoryRuleInputSchema } from "@/lib/server/pluggy/inputs";
import { pluggyResponse, rejectPluggyMethod } from "@/lib/server/pluggy/route";
import { privateRoute } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => Response.json({ ok: true, pending: await listPendingCategoryGroups(await getFinanceDatabase()) }));
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return pluggyResponse(async () => {
    const input = pluggyCategoryRuleInputSchema.parse(await request.json());
    return Response.json({ ok: true, ...await applyPendingCategory(input, await getFinanceDatabase()) });
  });
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectPluggyMethod;

export const OPTIONS = rejectPluggyMethod;
