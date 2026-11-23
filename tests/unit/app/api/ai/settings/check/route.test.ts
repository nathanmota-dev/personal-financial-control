import { generateText } from "ai";
import { expect, it, vi } from "vitest";
import { guardCases, request, routeDatabase } from "../../../../../helpers/route";
import { pluggyGuardCases } from "../../../pluggy/helpers";
import * as route from "@/app/api/ai/settings/check/route";

vi.mock("ai", async (importOriginal) => ({ ...(await importOriginal<typeof import("ai")>()), generateText: vi.fn() }));

routeDatabase();
guardCases(route);
pluggyGuardCases(route);

const KEY = "sk-route-secret-5678";
const post = (body: unknown) => route.POST(request("POST", body));
const body = { provider: "openai", model: "gpt-6-luna", connection: { kind: "apiKey", apiKey: KEY } };

it("answers ok when the provider responds", async () => {
  vi.mocked(generateText).mockResolvedValueOnce({ text: "ok" } as Awaited<ReturnType<typeof generateText>>);
  const response = await post(body);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(generateText).toHaveBeenCalledTimes(1);
});

it("never echoes the provider's error, which may carry the key", async () => {
  vi.mocked(generateText).mockRejectedValueOnce(new Error(`invalid key ${KEY}`));
  const response = await post(body);
  expect(response.status).toBe(502);
  const text = await response.text();
  expect(JSON.parse(text)).toMatchObject({ error: { code: "AI_CHECK_FAILED" } });
  expect(text).not.toContain(KEY);
});

it("asks for a key when there is none to keep", async () => {
  const response = await post({ provider: "openai", model: "gpt-6-luna" });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: { code: "AI_API_KEY_REQUIRED" } });
  expect(generateText).not.toHaveBeenCalled();
});

it("rejects invalid input", async () => {
  const response = await post({ provider: "openai", model: "" });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ error: { code: "INVALID_AI_REQUEST" } });
});
