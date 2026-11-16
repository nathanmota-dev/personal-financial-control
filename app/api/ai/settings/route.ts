import { apiGuard } from "@/lib/auth/server";
import { getFinanceDatabase } from "@/lib/db";
import { aiResponse, rejectAiMethod } from "@/lib/server/ai/route";
import { aiSettingsInputSchema } from "@/lib/server/ai/inputs";
import { deleteAiSettings, getAiSettingsView, saveAiSettings } from "@/lib/server/ai/settings";
import { privateRoute } from "@/lib/server/route-response";

async function handleGET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return aiResponse(async () => Response.json({ ok: true, settings: await getAiSettingsView(await getFinanceDatabase()) }));
}

async function handlePUT(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return aiResponse(async () => {
    const input = aiSettingsInputSchema.parse(await request.json());
    return Response.json({ ok: true, settings: await saveAiSettings(input, await getFinanceDatabase()) });
  });
}

async function handleDELETE(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  return aiResponse(async () => Response.json({ ok: true, settings: await deleteAiSettings(await getFinanceDatabase()) }));
}

export const GET = privateRoute(handleGET);

export const PUT = privateRoute(handlePUT);

export const DELETE = privateRoute(handleDELETE);

export const HEAD = rejectAiMethod;

export const OPTIONS = rejectAiMethod;
