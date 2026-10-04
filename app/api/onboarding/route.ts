import { apiGuard, authResponse, requireRequestSession } from "@/lib/auth/server";
import { getOnboarding, updateOnboarding } from "@/lib/server/onboarding";
import { onboardingUpdateSchema } from "@/lib/onboarding/schema";

const headers = { "Cache-Control": "private, no-store" };

async function handle(request: Request, mutate: boolean) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  let session;
  try { session = await requireRequestSession(request); }
  catch (error) { return authResponse(error); }
  let update;
  if (mutate) {
    try { update = onboardingUpdateSchema.parse(await request.json()); }
    catch { return Response.json({ ok: false, error: "Confira a etapa informada." }, { status: 400, headers }); }
  }
  try {
    const onboarding = update
      ? await updateOnboarding(session.uid, update)
      : await getOnboarding(session.uid);
    return Response.json({ ok: true, onboarding }, { headers });
  } catch {
    return Response.json({ ok: false, error: "Não foi possível salvar ou consultar a configuração. Tente novamente." }, { status: 503, headers });
  }
}

export async function GET(request: Request) { return handle(request, false); }
export async function PATCH(request: Request) { return handle(request, true); }

export async function HEAD(request: Request) {
  return await apiGuard(request) ?? new Response(null, { status: 405, headers });
}
export async function OPTIONS(request: Request) {
  return await apiGuard(request) ?? new Response(null, { status: 405, headers });
}
