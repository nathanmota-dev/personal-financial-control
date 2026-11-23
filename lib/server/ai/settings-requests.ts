import type { AppDb } from "@/lib/db";
import { checkAiSettings, listAiModels } from "@/lib/server/ai/check-connection";
import { aiModelsInputSchema, aiSettingsInputSchema } from "@/lib/server/ai/inputs";

/** POST /api/ai/settings/check: tries the form's configuration without saving it. */
export async function checkAiSettingsRequest(body: unknown, db: AppDb): Promise<Response> {
  await checkAiSettings(aiSettingsInputSchema.parse(body), db);
  return Response.json({ ok: true });
}

/** POST /api/ai/settings/models: the models a local provider has installed, at the address typed in the form. */
export async function listAiModelsRequest(body: unknown, db: AppDb): Promise<Response> {
  return Response.json({ ok: true, models: await listAiModels(aiModelsInputSchema.parse(body), db) });
}
