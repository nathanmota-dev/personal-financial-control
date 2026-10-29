import { and, eq } from "drizzle-orm";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/user-schema";
import { authResponse, AuthError, sessionMutation } from "@/lib/auth/server";
import { sessionResponse } from "@/lib/auth/cookies";
import { generateMcpToken, hashMcpToken } from "@/lib/auth/mcp-token";
async function changeToken(request: Request, revoke: boolean) {
  try {
    const session = await sessionMutation(request, true);
    const token = revoke ? null : generateMcpToken();
    const changed = await (await getAuthDatabase()).update(authorizedUsers).set({ mcpTokenHash: token ? hashMcpToken(token) : null })
      .where(and(eq(authorizedUsers.email, session.email), eq(authorizedUsers.sessionVersion, session.ver))).returning({ email: authorizedUsers.email });
    if (!changed.length) throw new AuthError(401);
    return sessionResponse({ ok: true, ...(token ? { token } : {}) });
  } catch (error) { return authResponse(error); }
}
export async function POST(request: Request) { return changeToken(request, false); }
export async function DELETE(request: Request) { return changeToken(request, true); }
