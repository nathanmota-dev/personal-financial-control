import { NextResponse } from "next/server";
import { authConfig } from "./config";
import { createUnlock, signCookie } from "./local-session";
import type { LocalSession, LockSettings, UnlockSession } from "@/lib/interfaces/local-auth";

export function cookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, path: "/", secure: authConfig().secure };
}
export function sessionResponse(body: object = { ok: true }, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
export function clearSession(response = sessionResponse()) {
  for (const name of ["session", "unlock"]) response.cookies.set(name, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
export function setUnlockCookie(response: NextResponse, unlock: UnlockSession) {
  response.cookies.set("unlock", signCookie(unlock, "unlock"), {
    ...cookieOptions(), ...(unlock.bootId === undefined ? { maxAge: unlock.timeout * 60 } : {}),
  });
  return response;
}
export function unlockResponse(session: LocalSession, settings: LockSettings) {
  return setUnlockCookie(sessionResponse(), createUnlock(session, settings));
}
