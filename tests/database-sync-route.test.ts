import { afterEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/database/sync/route";
import { requireRequestSession, sessionMutation } from "@/lib/auth/server";
import { getDatabaseSyncStatus, synchronizeDatabase } from "@/lib/db/replica";
import { revalidatePath } from "next/cache";
vi.mock("@/lib/auth/server", () => ({ apiGuard: vi.fn(), requireRequestSession: vi.fn(), sessionMutation: vi.fn(), authResponse: () => new Response(null, { status: 401 }) }));
vi.mock("@/lib/db/replica", () => ({ getDatabaseSyncStatus: vi.fn(), synchronizeDatabase: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
const state = { mode: "replica" as const, state: "ready" as const, revision: 1, lastSuccessfulSyncAt: "2026-10-29T00:00:00Z", intervalSeconds: 30 };
afterEach(() => vi.resetAllMocks());
describe("authenticated replica synchronization", () => {
  it("GET returns private status without synchronizing", async () => {
    vi.mocked(getDatabaseSyncStatus).mockResolvedValue(state);
    const response = await GET(new Request("http://localhost/api/database/sync"));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).status).toEqual(state);
    expect(synchronizeDatabase).not.toHaveBeenCalled();
    expect(requireRequestSession).toHaveBeenCalledOnce();
  });
  it("POST checks session/origin then rechecks authorization after pulling changes", async () => {
    vi.mocked(getDatabaseSyncStatus).mockResolvedValue(state);
    vi.mocked(synchronizeDatabase).mockResolvedValue({ ...state, revision: 2 });
    const request = new Request("http://localhost/api/database/sync", { method: "POST" });
    expect((await POST(request)).status).toBe(200);
    expect(sessionMutation).toHaveBeenCalledWith(request, true);
    expect(requireRequestSession).toHaveBeenCalledWith(request);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
  it("returns a degraded status with 503 and never invalidates unchanged data", async () => {
    vi.mocked(getDatabaseSyncStatus).mockResolvedValue(state);
    vi.mocked(synchronizeDatabase).mockResolvedValue({ ...state, state: "unavailable" });
    const response = await POST(new Request("http://localhost/api/database/sync", { method: "POST" }));
    expect(response.status).toBe(503);
    expect((await response.json()).status.lastSuccessfulSyncAt).toBe(state.lastSuccessfulSyncAt);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated reads and unauthorized writes before remote access", async () => {
    vi.mocked(requireRequestSession).mockRejectedValue(new Error("unauthorized"));
    vi.mocked(sessionMutation).mockRejectedValue(new Error("invalid origin"));
    expect((await GET(new Request("http://localhost"))).status).toBe(401);
    expect((await POST(new Request("http://localhost", { method: "POST" }))).status).toBe(401);
    expect(synchronizeDatabase).not.toHaveBeenCalled();
    expect(getDatabaseSyncStatus).not.toHaveBeenCalled();
  });
});
