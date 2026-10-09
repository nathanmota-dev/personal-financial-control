import { adminAuth, apiGuard, authResponse, requireRequestSession } from "@/lib/auth/server";
import { profileSchema } from "@/lib/auth/profile-schema";
import { isDemoMode } from "@/lib/demo/mode";
import { privateRoute, rejectRouteMethod } from "@/lib/server/route-response";

async function handlePATCH(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  if (isDemoMode()) {
    return Response.json({ ok: false, error: "O perfil de demonstração não pode ser alterado." }, { status: 403 });
  }
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Informe um nome válido e envie apenas nome e sobrenome." }, { status: 400 });
  }
  try {
    const session = await requireRequestSession(request);
    const displayName = [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(" ");
    await (await adminAuth()).updateUser(session.uid, { displayName });
    return Response.json({ ok: true, displayName });
  } catch (error) {
    return authResponse(error);
  }
}

export const PATCH = privateRoute(handlePATCH);
export const HEAD = rejectRouteMethod;
export const OPTIONS = rejectRouteMethod;
