import { afterEach, describe, expect, it, vi } from "vitest";

const sdkImports = vi.hoisted(() => ({
  app: vi.fn(() => { throw new Error("Firebase app must not load in demo mode"); }),
  auth: vi.fn(() => { throw new Error("ERR_REQUIRE_ESM: jose"); }),
}));

vi.mock("firebase-admin/app", sdkImports.app);
vi.mock("firebase-admin/auth", sdkImports.auth);
vi.mock("next/headers", () => ({
  cookies: async () => { throw new Error("Demo must not read session cookies"); },
  headers: async () => new Headers({ origin: "https://demo.example", host: "demo.example" }),
}));

import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { apiGuard, requireActionSession, requirePageSession } from "@/lib/auth/server";

afterEach(() => vi.unstubAllEnvs());

describe("demo isolation from Firebase runtime dependencies", () => {
  it("serves pages, reads and writes even when importing Firebase would throw", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "true");
    for (const key of ["APP_URL", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]) {
      vi.stubEnv(key, "");
    }

    expect((await proxy(new NextRequest("https://demo.example/dashboard"))).status).toBe(200);
    expect(await requirePageSession()).toEqual({ name: "Visitante demo", picture: null });
    expect(await apiGuard(new Request("https://demo.example/api/accounts"))).toBeNull();
    expect(await apiGuard(new Request("https://demo.example/api/accounts", {
      method: "POST",
      headers: { origin: "https://demo.example", "content-type": "application/json" },
      body: "{}",
    }))).toBeNull();
    await expect(requireActionSession()).resolves.toBeUndefined();
    expect(sdkImports.app).not.toHaveBeenCalled();
    expect(sdkImports.auth).not.toHaveBeenCalled();
  });
});
