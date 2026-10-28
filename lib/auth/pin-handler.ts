import { z } from "zod";
import { authResponse, AuthError, sessionMutation } from "./server";
import { pinSchema } from "./pin";
import { applyPin } from "./pin-service";
import { clearSession, sessionResponse, unlockResponse } from "./cookies";

export async function pinHandler(request: Request, operation: "setup" | "change" | "unlock") {
  try {
    const session = await sessionMutation(request, operation === "change");
    const schema = z.object({ pin: pinSchema, ...(operation === "change" ? { currentPin: pinSchema } : {}) }).strict();
    const body = schema.safeParse(await request.json().catch(() => null));
    if (!body.success) throw new AuthError(400);
    const result = await applyPin(session, operation, body.data.pin, "currentPin" in body.data && typeof body.data.currentPin === "string" ? body.data.currentPin : undefined);
    if (!result.ok) {
      const response = sessionResponse({ ok: false, remaining: result.remaining }, result.lockedOut ? 401 : 400);
      return result.lockedOut ? clearSession(response) : response;
    }
    return unlockResponse(session, result.user);
  } catch (error) { return authResponse(error); }
}
