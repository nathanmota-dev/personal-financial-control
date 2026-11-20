import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { getAiConfig } from "@/lib/server/ai/config";
import { streamChatResponse } from "@/lib/server/ai/chat";
import { aiResponse, rejectAiMethod } from "@/lib/server/ai/route";
import { privateRoute } from "@/lib/server/route-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return aiResponse(async () => Response.json({ ok: true, configured: Boolean(await getAiConfig(await getFinanceDatabase())) }));
}

async function handlePOST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return aiResponse(async () => {
    const db = await getFinanceDatabase();
    return streamChatResponse(request, await getAiConfig(db), db);
  });
}

export const GET = privateRoute(handleGET);

export const POST = privateRoute(handlePOST);

export const HEAD = rejectAiMethod;

export const OPTIONS = rejectAiMethod;
