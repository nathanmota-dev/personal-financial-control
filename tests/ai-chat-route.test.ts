import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ denied: null as Response | null, config: null as unknown, demo: false }));

vi.mock("@/lib/auth/server", () => ({ apiGuard: async () => state.denied }));
vi.mock("@/lib/db", () => ({ getFinanceDatabase: async () => ({}) }));
vi.mock("@/lib/server/ai/config", () => ({ getAiConfig: async () => state.config }));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => state.demo }));
vi.mock("@/lib/server/ai/chat", async (original) => ({
  ...(await original<typeof import("@/lib/server/ai/chat")>()),
  streamChatResponse: vi.fn(async (_request: Request, config: unknown) => {
    const { DomainError } = await import("@/lib/server/errors");
    if (!config) throw new DomainError("AI_NOT_CONFIGURED", "sem ia", 409);
    return new Response("ok", { status: 200 });
  }),
}));

import { GET, HEAD, POST } from "@/app/api/ai/chat/route";

const url = "http://localhost/api/ai/chat";
const post = () => new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });

beforeEach(() => { state.denied = null; state.config = { provider: "openai", model: "m", apiKey: "k-123456789" }; state.demo = false; });

describe("/api/ai/chat", () => {
  it("reports whether an AI is configured", async () => {
    expect(await (await GET(new Request(url))).json()).toEqual({ ok: true, configured: true });
    state.config = null;
    expect(await (await GET(new Request(url))).json()).toEqual({ ok: true, configured: false });
  });

  it("streams through the chat handler", async () => {
    expect(await (await POST(post())).text()).toBe("ok");
  });

  it("answers 409 when no AI is configured", async () => {
    state.config = null;
    expect((await POST(post())).status).toBe(409);
  });

  it("blocks locked or signed-out sessions before anything runs", async () => {
    state.denied = Response.json({ ok: false }, { status: 401 });
    expect((await POST(post())).status).toBe(401);
    expect((await GET(new Request(url))).status).toBe(401);
  });

  it("is unavailable in demo mode", async () => {
    state.demo = true;
    expect((await POST(post())).status).toBe(404);
  });

  it("rejects other methods", async () => {
    expect((await HEAD(new Request(url, { method: "HEAD" }))).status).toBeGreaterThanOrEqual(400);
  });
});

