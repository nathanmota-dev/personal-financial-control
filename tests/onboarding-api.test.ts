import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), session: vi.fn(), get: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({ apiGuard: mocks.guard, requireRequestSession: mocks.session, authResponse: () => Response.json({ ok: false }, { status: 401, headers: { "Cache-Control": "private, no-store" } }) }));
vi.mock("@/lib/server/onboarding", () => ({ getOnboarding: mocks.get, updateOnboarding: mocks.update }));
import { GET, PATCH, HEAD, OPTIONS } from "@/app/api/onboarding/route";

function request(body?: unknown) {
  return new Request("http://localhost/api/onboarding", { method: body === undefined ? "GET" : "PATCH", ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue(null);
  mocks.session.mockResolvedValue({ uid: "firebase-uid" });
  mocks.get.mockResolvedValue({ step: 1, completedAt: null });
  mocks.update.mockResolvedValue({ step: 3, completedAt: null });
});
it("reads and updates exclusively for the validated session", async () => {
  expect(await (await GET(request())).json()).toEqual({ ok: true, onboarding: { step: 1, completedAt: null } });
  const response = await PATCH(request({ step: 3 }));
  expect(mocks.get).toHaveBeenCalledWith("firebase-uid");
  expect(mocks.update).toHaveBeenCalledWith("firebase-uid", { step: 3 });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await PATCH(request({ completed: true }));
  expect(mocks.update).toHaveBeenLastCalledWith("firebase-uid", { completed: true });
});
it.each([{ step: 0 }, { step: 6 }, { step: "2" }, { completed: false }, { step: 2, userId: "attacker" }, { step: 2, completed: true }, {}])("rejects payload %j", async input => {
  expect((await PATCH(request(input))).status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects malformed JSON", async () => {
  expect((await PATCH(new Request("http://localhost/api/onboarding", { method: "PATCH", body: "{" }))).status).toBe(400);
});
it.each([GET, PATCH, HEAD, OPTIONS])("preserves guard rejection", async handler => {
  mocks.guard.mockResolvedValue(Response.json({}, { status: 403 }));
  expect((await handler(request())).status).toBe(403);
  expect(mocks.session).not.toHaveBeenCalled();
});
it("handles rejected session and database outage", async () => {
  mocks.session.mockRejectedValueOnce(new Error());
  expect((await GET(request())).status).toBe(401);
  mocks.get.mockRejectedValueOnce(new Error());
  expect((await GET(request())).status).toBe(503);
  mocks.update.mockRejectedValueOnce(new Error());
  expect((await PATCH(request({ step: 2 }))).status).toBe(503);
  expect((await HEAD(request())).status).toBe(405);
  expect((await OPTIONS(request())).status).toBe(405);
});
