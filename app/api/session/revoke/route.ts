import { authConfig } from "@/lib/auth/config";
import { adminAuth,apiGuard,authResponse,verifySession } from "@/lib/auth/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    const user = await verifySession((await cookies()).get("session")?.value);
    await (await adminAuth()).revokeRefreshTokens(user.uid);
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    response.cookies.set("session", "", { httpOnly: true, sameSite: "lax", path: "/", secure: authConfig().secure, maxAge: 0 });
    return response;
  } catch (error) { return authResponse(error); }
}
