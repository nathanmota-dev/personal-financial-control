import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const state = vi.hoisted(() => ({ cookies: {} as Record<string, string>, verifyIdToken: vi.fn() }));
vi.mock("firebase-admin/app", () => ({ cert: vi.fn(), initializeApp: vi.fn(), getApps: () => [{ name: "pfc-auth" }] }));
vi.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken: state.verifyIdToken }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => ({ value: state.cookies[name] }) }), headers: async () => new Headers({ origin: "http://127.0.0.1:3007", host: "127.0.0.1:3007" }) }));
vi.mock("@/lib/db", async original => ({ ...await original<typeof import("@/lib/db")>(), getDatabase: vi.fn() }));
import { getDatabase } from "@/lib/db";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/user-schema";
import { createTestDatabase } from "./helpers/database";
import { createSession, createUnlock, signCookie } from "@/lib/auth/local-session";
import { hashPin } from "@/lib/auth/pin";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { apiGuard, verifyLocalSession, requirePageSession, requireActionSession } from "@/lib/auth/server";
import { authConfig, safeDestination, isAllowedOrigin } from "@/lib/auth/config";
import { PATCH as profile } from "@/app/api/profile/route";
import { POST, DELETE } from "@/app/api/session/route";
import { POST as setup, PATCH as changePin } from "@/app/api/pin/route";
import { POST as unlock } from "@/app/api/unlock/route";
import { POST as activity, DELETE as lock } from "@/app/api/session/activity/route";
import { PATCH as settings } from "@/app/api/security/route";
import { POST as generateToken, DELETE as revokeToken } from "@/app/api/security/token/route";
import { POST as mcp } from "@/app/api/mcp/route";
import { verifyMcpToken } from "@/lib/auth/mcp-token";
const origin = "http://127.0.0.1:3007";
const claims = { uid: "owner", name: "Ana", email: "owner@gmail.com", email_verified: true, firebase: { sign_in_provider: "google.com" }, auth_time: Math.floor(Date.now() / 1000) };
let database: Awaited<ReturnType<typeof createTestDatabase>>;
function request(method = "POST", body: unknown = {}, headers: Record<string, string> = {}) {
  return new Request(origin + "/api/session", { method, headers: { origin, cookie: Object.entries(state.cookies).map(([k, v]) => `${k}=${v}`).join("; "), "content-type": "application/json", ...headers }, ...(!["GET", "HEAD"].includes(method) ? { body: JSON.stringify(body) } : {}) });
}
function accept(response: Response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [name, value] = cookie.split(";")[0].split("="); state.cookies[name] = value;
  }
}
async function login() { const response = await POST(request("POST", { idToken: "valid" })); accept(response); return response; }
beforeEach(async () => {
  vi.clearAllMocks(); state.cookies = {};
  for (const [key, value] of Object.entries({ DEMO_MODE: "false", NODE_ENV: "test", APP_URL: origin, APP_URL_DEVELOPMENT: origin, FIREBASE_PROJECT_ID: "test", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "test", NEXT_PUBLIC_FIREBASE_API_KEY: "key", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com", NEXT_PUBLIC_FIREBASE_APP_ID: "test", FIREBASE_CLIENT_EMAIL: "admin@test", FIREBASE_PRIVATE_KEY: "key" })) vi.stubEnv(key, value);
  database = await createTestDatabase(); vi.mocked(getDatabase).mockReturnValue(database.db);
  await getAuthDatabase().insert(authorizedUsers).values({ email: claims.email, pinHash: await hashPin("123456") });
  const session = createSession(claims, 0);
  state.cookies = { session: signCookie(session, "session"), unlock: signCookie(createUnlock(session, { lockTimeoutMinutes: 15, lockOnClose: true }), "unlock") };
  state.verifyIdToken.mockResolvedValue(claims);
});
afterEach(async () => { await database.cleanup(); vi.unstubAllEnvs(); });

describe("local session and PIN routes", () => {
  it("uses Firebase only for login and keeps guards/profile completely local", async () => {
    expect((await login()).status).toBe(200);
    expect(state.cookies.unlock).toBe("");
    expect((await apiGuard(request("GET")))?.status).toBe(423);
    accept(await unlock(request("POST", { pin: "123456" })));
    state.verifyIdToken.mockImplementation(() => { throw new Error("No network after login"); });
    expect(await apiGuard(request("GET"))).toBeNull();
    await requireActionSession();
    expect(await requirePageSession()).toMatchObject({ name: "Ana" });
    expect((await profile(request("PATCH", { firstName: "Ana", lastName: "Silva" }))).status).toBe(200);
    expect(await requirePageSession()).toMatchObject({ name: "Ana Silva" });
    expect(state.verifyIdToken).toHaveBeenCalledTimes(1);
  });
  it("defines a PIN only when none exists, then rejects replacing it without the current PIN", async () => {
    await getAuthDatabase().update(authorizedUsers).set({ pinHash: null });
    state.cookies.unlock = "";
    expect((await setup(request("POST", { pin: "123" }))).status).toBe(400);
    const response = await setup(request("POST", { pin: "654321" })); expect(response.status).toBe(200); accept(response);
    expect((await setup(request("POST", { pin: "999999" }))).status).toBe(403);
    expect((await changePin(request("PATCH", { pin: "999999", currentPin: "654321" }))).status).toBe(200);
    expect((await unlock(request("POST", { pin: "999999" }))).status).toBe(200);
  });
  it("counts wrong attempts atomically, resets after success, and invalidates all sessions on the fifth", async () => {
    expect(await (await unlock(request("POST", { pin: "000000" }))).json()).toMatchObject({ remaining: 4 });
    await unlock(request("POST", { pin: "123456" }));
    for (let i = 1; i <= 5; i++) {
      const response = await unlock(request("POST", { pin: "000000" }));
      expect(response.status).toBe(i === 5 ? 401 : 400);
      expect(await response.json()).toMatchObject({ remaining: 5 - i });
      if (i === 5) expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    }
    await expect(verifyLocalSession(state.cookies.session)).rejects.toMatchObject({ status: 401 });
    await login(); expect((await unlock(request("POST", { pin: "123456" }))).status).toBe(200);
  });
  it("requires a new Google login after requesting a PIN reset", async () => {
    expect((await DELETE(request("DELETE", {}, { "x-session-intent": "pin-reset" }))).status).toBe(200);
    expect((await setup(request("POST", { pin: "111111" }))).status).toBe(401);
    await login();
    expect((await unlock(request("POST", { pin: "123456" }))).status).toBe(403);
    accept(await setup(request("POST", { pin: "111111" })));
    expect(await apiGuard(request("GET"))).toBeNull();
    expect((await getAuthDatabase().select().from(authorizedUsers).get())?.pinResetRequested).toBe(false);
  });
  it("logout invalidates copies, clears both cookies and tolerates absent/expired cookies", async () => {
    const response = await DELETE(request("DELETE"));
    expect(response.headers.get("set-cookie")).toContain("unlock=;");
    await expect(verifyLocalSession(state.cookies.session)).rejects.toMatchObject({ status: 401 });
    expect((await DELETE(request("DELETE"))).status).toBe(200);
    state.cookies = {}; expect((await DELETE(request("DELETE"))).status).toBe(200);
  });
  it("heartbeats require unlock, manual locking clears unlock, settings control persistence", async () => {
    expect((await activity(request())).headers.get("set-cookie")).not.toContain("Max-Age");
    const response = await settings(request("PATCH", { lockTimeoutMinutes: 1, lockOnClose: false }));
    expect(response.status).toBe(200); expect(response.headers.get("set-cookie")).toContain("Max-Age=60");
    expect((await activity(request())).status).toBe(423); // old settings cannot be renewed
    accept(response); expect((await activity(request())).status).toBe(200);
    accept(await lock(request("DELETE"))); expect((await activity(request())).status).toBe(423);
  });
  it("validates settings and PIN formats before writing", async () => {
    for (const minutes of [0, 121, 1.5]) expect((await settings(request("PATCH", { lockTimeoutMinutes: minutes, lockOnClose: true }))).status).toBe(400);
    for (const pin of [null, 123456, "abcdef", "12345", "1234567"]) expect((await unlock(request("POST", { pin }))).status).toBe(400);
    expect((await changePin(request("PATCH", { pin: "111111" }))).status).toBe(400);
  });
  it("authenticates the MCP HTTP route by bearer even while the browser is locked", async () => {
    const { token } = await (await generateToken(request())).json();
    const rpc = (authorization?: string) => new Request(origin + "/api/mcp", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(authorization ? { Authorization: authorization } : {}), cookie: `session=${state.cookies.session}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    state.cookies.unlock = "";
    expect((await mcp(rpc())).status).toBe(401);
    expect((await mcp(rpc(`Bearer ${token}`))).status).toBe(200);
    accept(await unlock(request("POST", { pin: "123456" })));
    await revokeToken(request("DELETE"));
    expect((await mcp(rpc(`Bearer ${token}`))).status).toBe(401);
  });
  it("stores only token hashes; regeneration/revocation immediately invalidate old MCP credentials", async () => {
    const first = await (await generateToken(request())).json();
    expect(first.token).toMatch(/^[\w-]{43}$/);
    expect((await getAuthDatabase().select().from(authorizedUsers).get())?.mcpTokenHash).not.toBe(first.token);
    expect(await verifyMcpToken(`Bearer ${first.token}`)).toBe(true);
    const second = await (await generateToken(request())).json();
    expect(await verifyMcpToken(`Bearer ${first.token}`)).toBe(false);
    state.cookies.unlock = ""; expect(await verifyMcpToken(`Bearer ${second.token}`)).toBe(true);
    expect((await revokeToken(request("DELETE"))).status).toBe(423);
    accept(await unlock(request("POST", { pin: "123456" })));
    await revokeToken(request("DELETE")); expect(await verifyMcpToken(`Bearer ${second.token}`)).toBe(false);
    expect(await verifyMcpToken(null)).toBe(false);
  });
});

describe("access boundary", () => {
  it.each([{ email: "other@gmail.com" }, { email_verified: false }, { firebase: { sign_in_provider: "password" } }])("rejects forbidden claims %j", async override => {
    state.verifyIdToken.mockResolvedValue({ ...claims, ...override }); expect((await login()).status).toBe(403);
  });
  it.each([-301, 31, NaN])("rejects nonrecent auth_time %s", async offset => {
    state.verifyIdToken.mockResolvedValue({ ...claims, auth_time: Date.now() / 1000 + offset }); expect((await login()).status).toBe(401);
  });
  it("rejects bad input, CSRF, stale sessions and removed users", async () => {
    expect((await POST(request("POST", {}))).status).toBe(400);
    expect((await POST(request("POST", {}, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await DELETE(request("DELETE", {}, { origin: "https://evil.test" }))).status).toBe(403);
    expect((await apiGuard(request("POST", {}, { origin: "https://evil.test" })))?.status).toBe(403);
    expect((await apiGuard(request("POST", {}, { "content-type": "text/plain" })))?.status).toBe(415);
    await getAuthDatabase().delete(authorizedUsers);
    await expect(verifyLocalSession(state.cookies.session)).rejects.toMatchObject({ status: 401 });
  });
  it("proxy does no database or Firebase access, redirects with next, and slides only valid unlocks", async () => {
    const req = (path: string, cookie = "") => new NextRequest(origin + path, { headers: { host: "127.0.0.1:3007", cookie } });
    vi.mocked(getDatabase).mockImplementation(() => { throw new Error("proxy must not touch DB"); });
    expect((await proxy(req("/api/accounts"))).status).toBe(401);
    const result = await proxy(req("/transactions?month=2026-10"));
    expect(new URL(result.headers.get("location")!).searchParams.get("next")).toBe("/transactions?month=2026-10");
    expect((await proxy(req("/api/accounts", `session=${state.cookies.session}`))).status).toBe(423);
    expect((await proxy(req("/lock", `session=${state.cookies.session}`))).headers.get("x-middleware-next")).toBe("1");
    const session = createSession(claims, 0);
    const unlocked = createUnlock(session, { lockTimeoutMinutes: 15, lockOnClose: true }); unlocked.lastActivity -= 61000;
    const response = await proxy(req("/dashboard", `session=${signCookie(session, "session")}; unlock=${signCookie(unlocked, "unlock")}`));
    expect(response.headers.get("set-cookie")).toContain("unlock=");
    expect((await proxy(req("/api/mcp"))).status).toBe(200);
  });
  it("page/action/API guards reject locked and missing sessions", async () => {
    state.cookies.unlock = "";
    await expect(requirePageSession()).rejects.toThrow("NEXT_REDIRECT");
    await expect(requireActionSession()).rejects.toMatchObject({ status: 423 });
    expect((await apiGuard(request("GET")))?.status).toBe(423);
    state.cookies.session = "invalid";
    await expect(requirePageSession()).rejects.toThrow("NEXT_REDIRECT");
    const actions = await import("@/app/actions/finance");
    for (const action of Object.values(actions)) await expect((action as () => Promise<unknown>)()).rejects.toMatchObject({ status: 401 });
  });
  it("audits every financial page, action and route guard", () => {
    function files(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]); }
    for (const path of files("app/(finance)").filter(p => p.endsWith("page.tsx"))) expect(readFileSync(path, "utf8"), path).toContain("await requirePageSession();");
    for (const path of files("app/actions/finance").filter(p => p.endsWith(".ts") && !p.endsWith("action-runtime.ts"))) {
      const source = readFileSync(path, "utf8"); expect([...source.matchAll(/export async function/g)].length).toBe([...source.matchAll(/await requireActionSession\(\)/g)].length);
    }
    for (const path of files("app/api").filter(p => p.endsWith("route.ts") && !/session|pin|unlock|security|mcp/.test(p))) expect(readFileSync(path, "utf8"), path).toContain("await apiGuard(");
  });
  it("keeps demo isolated and validates safe destinations and environment origins", async () => {
    for (const target of ["//evil.test", "/login", "/lock", "/api/a", "/%", "/%2f/evil.test"]) expect(safeDestination(target)).toBe("/dashboard");
    expect(safeDestination("/transactions?month=2026-10")).toContain("?month=");
    vi.stubEnv("NODE_ENV", "development"); expect(isAllowedOrigin("http://localhost:3007", origin)).toBe(true);
    expect(authConfig().origin).toBe(origin);
    vi.stubEnv("APP_URL_DEVELOPMENT", "invalid"); expect(() => authConfig()).toThrow();
    vi.stubEnv("DEMO_MODE", "true");
    expect(await requirePageSession()).toEqual({ name: "Visitante demo", picture: null });
    await requireActionSession(); expect(await apiGuard(request("GET"))).toBeNull();
    expect((await setup(request())).status).toBe(404);
    expect((await POST(request())).status).toBe(404);
    expect((await proxy(new NextRequest(origin + "/api/pin"))).status).toBe(404);
  });
});
