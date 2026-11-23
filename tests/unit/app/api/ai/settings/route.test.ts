import { expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../helpers/route";
import { pluggyGuardCases } from "../../pluggy/helpers";
import * as route from "@/app/api/ai/settings/route";
import { getFinanceDatabase } from "@/lib/db";

routeDatabase();
guardCases(route);
pluggyGuardCases(route);

const KEY = "sk-route-secret-5678";
const keyed = (apiKey: string) => ({ kind: "apiKey", apiKey });
const put = (body: unknown) => route.PUT(request("PUT", body));

it("starts without a configuration", async () => {
  vi.stubEnv("AI_PROVIDER", "");
  await expect((await route.GET(request())).json()).resolves.toEqual({ ok: true, settings: { provider: null, model: null, connection: null, source: null } });
});

it("saves the configuration and never returns the key", async () => {
  const response = await put({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) });
  expect(response.status).toBe(200);
  const text = await response.text();
  expect(JSON.parse(text)).toMatchObject({ settings: { provider: "google", model: "gemini-3.6-flash", connection: { kind: "apiKey", keyMasked: "••••5678" }, source: "app" } });
  expect(text).not.toContain(KEY);
  expect(await (await route.GET(request())).text()).not.toContain(KEY);
  const { rows } = await (await getFinanceDatabase()).$client.execute("SELECT connection FROM ai_settings");
  expect(rows[0].connection).toMatch(/^pfc:v2:/);
});

it("asks for a key when there is none to keep", async () => {
  const response = await put({ provider: "google", model: "gemini-3.6-flash" });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: { code: "AI_API_KEY_REQUIRED" } });
});

it.each([
  [{ provider: "mistral", model: "x", connection: keyed(KEY) }],
  [{ provider: "google", model: "", connection: keyed(KEY) }],
  [{ provider: "google", model: "gemini-3.6-flash", connection: keyed("short") }],
  [{ provider: "ollama", model: "qwen3:8b", connection: { kind: "local", baseUrl: "file:///etc/passwd" } }],
])("rejects invalid input %#", async (body) => {
  const response = await put(body);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: { code: "INVALID_AI_REQUEST" } });
});

it("removes the configuration", async () => {
  vi.stubEnv("AI_PROVIDER", "");
  await put({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) });
  const response = await route.DELETE(request("DELETE"));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ settings: { source: null } });
});
