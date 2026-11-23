import { afterEach, expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../../helpers/route";
import { pluggyGuardCases } from "../../../pluggy/helpers";
import * as route from "@/app/api/ai/settings/models/route";

routeDatabase();
guardCases(route);
pluggyGuardCases(route);

afterEach(() => vi.unstubAllGlobals());

const post = (body: unknown) => route.POST(request("POST", body));
const local = { kind: "local", baseUrl: "http://localhost:11434/v1" };

it("lists the models installed on the local server", async () => {
  const fetcher = vi.fn(async () => Response.json({ models: [{ name: "qwen3:8b" }] }));
  vi.stubGlobal("fetch", fetcher);
  const response = await post({ provider: "ollama", connection: local });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true, models: [{ id: "qwen3:8b", label: "qwen3:8b" }] });
  expect(fetcher).toHaveBeenCalledWith("http://localhost:11434/api/tags", expect.anything());
});

it("explains when the server cannot be reached", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
  const response = await post({ provider: "ollama", connection: local });
  expect(response.status).toBe(502);
  expect(await response.json()).toMatchObject({ error: { code: "AI_MODELS_UNAVAILABLE" } });
});

it("refuses a cloud provider, which keeps its fixed catalog", async () => {
  const response = await post({ provider: "google", connection: { kind: "apiKey", apiKey: "sk-route-secret-5678" } });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: { code: "AI_MODELS_UNSUPPORTED" } });
});

it("rejects an address that is not http(s)", async () => {
  const response = await post({ provider: "ollama", connection: { kind: "local", baseUrl: "file:///etc/passwd" } });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: { code: "INVALID_AI_REQUEST" } });
});
