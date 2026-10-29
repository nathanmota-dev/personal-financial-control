import { apiGuard, authResponse, requireRequestSession, sessionMutation } from "@/lib/auth/server";
import { getDatabaseSyncStatus, synchronizeDatabase } from "@/lib/db/replica";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    await requireRequestSession(request);
    return Response.json({ ok: true, status: await getDatabaseSyncStatus() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return authResponse(error); }
}

export async function POST(request: Request) {
  const denied = await apiGuard(request);
  if (denied) return denied;
  try {
    await sessionMutation(request, true);
    const before = await getDatabaseSyncStatus();
    const status = await synchronizeDatabase();
    // Recheck authorization after pulling remote revocations or PIN settings.
    await requireRequestSession(request);
    if (status.revision !== before.revision) revalidatePath("/", "layout");
    return Response.json({ ok: status.state === "ready", status }, {
      status: status.state === "unavailable" ? 503 : 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) { return authResponse(error); }
}
