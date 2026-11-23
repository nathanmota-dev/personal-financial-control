import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AI_CHECK_ERROR, checkAiSettings, listAiModels } from "@/lib/server/ai/check-connection";
import { saveAiSettings } from "@/lib/server/ai/settings";
import { createTestDatabase } from "@/tests/helpers/database";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

beforeEach(async () => { database = await createTestDatabase(); });
afterEach(async () => { await database.cleanup(); });

const usage = { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } };
const keyed = { kind: "apiKey", apiKey: "sk-check-key-1234" } as const;

function answering() {
  return new MockLanguageModelV4({
    doGenerate: async () => ({ content: [{ type: "text", text: "ok" }], finishReason: { unified: "stop", raw: "stop" }, usage, warnings: [] }),
  });
}

describe("checkAiSettings", () => {
  it("sends one short prompt with the form's configuration", async () => {
    const model = answering();
    await checkAiSettings({ provider: "google", model: "gemini-3.6-flash", connection: keyed }, database.db, { model });
    expect(model.doGenerateCalls).toHaveLength(1);
    const [call] = model.doGenerateCalls;
    expect(call.maxOutputTokens).toBe(64);
    expect(call.abortSignal).toBeDefined();
    expect(call.providerOptions).toEqual({ google: { thinkingConfig: { thinkingLevel: "low" } } });
  });

  it("uses the saved key when the form leaves it out", async () => {
    await saveAiSettings({ provider: "openai", model: "gpt-6-luna", connection: keyed }, database.db);
    await expect(checkAiSettings({ provider: "openai", model: "gpt-6-luna" }, database.db, { model: answering() })).resolves.toBeUndefined();
  });

  it("asks for a key before calling anything", async () => {
    const model = answering();
    await expect(checkAiSettings({ provider: "openai", model: "gpt-6-luna" }, database.db, { model })).rejects.toMatchObject({ code: "AI_API_KEY_REQUIRED" });
    expect(model.doGenerateCalls).toHaveLength(0);
  });

  it("replaces the provider's error with a fixed message", async () => {
    const model = new MockLanguageModelV4({ doGenerate: async () => { throw new Error("401 invalid key sk-check-key-1234"); } });
    const failure = await checkAiSettings({ provider: "openai", model: "gpt-6-luna", connection: keyed }, database.db, { model }).catch((error: unknown) => error);
    expect(failure).toMatchObject({ code: "AI_CHECK_FAILED", status: 502, message: AI_CHECK_ERROR });
  });
});

describe("listAiModels", () => {
  it("is only offered by providers that can list their own models", async () => {
    await expect(listAiModels({ provider: "google", connection: keyed }, database.db)).rejects.toMatchObject({ code: "AI_MODELS_UNSUPPORTED", status: 400 });
  });

  it("asks for the address of a local server before listing", async () => {
    await expect(listAiModels({ provider: "ollama" }, database.db)).rejects.toMatchObject({ code: "AI_BASE_URL_REQUIRED" });
  });
});
