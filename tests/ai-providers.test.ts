import { generateText } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiConfig } from "@/lib/interfaces/ai-categorization";
import { normalizeBaseUrl } from "@/lib/server/ai/connection";
import { createLanguageModel, languageModelOptions, languageModelTimeouts } from "@/lib/server/ai/model";
import { listOllamaModels } from "@/lib/server/ai/providers/ollama";

const keyed = (apiKey: string) => ({ kind: "apiKey", apiKey }) as const;
const local = { kind: "local", baseUrl: "http://localhost:11434" } as const;
const ollama: AiConfig = { provider: "ollama", model: "qwen3:8b", connection: local };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const completion = {
  id: "chatcmpl-1",
  object: "chat.completion",
  created: 1,
  model: "qwen3:8b",
  choices: [{ index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("provider registry", () => {
  it.each([
    ["google", "google"],
    ["openai", "openai"],
    ["anthropic", "anthropic"],
    ["deepseek", "deepseek"],
  ] as const)("builds the %s model with the key it is given", (provider, prefix) => {
    const model = createLanguageModel({ provider, model: "some-model", connection: keyed("sk-test-key-123") });
    expect(typeof model === "object" && model.provider.startsWith(prefix)).toBe(true);
    expect(typeof model === "object" && model.modelId).toBe("some-model");
  });

  it("refuses a connection that does not fit the provider", () => {
    expect(() => createLanguageModel({ ...ollama, connection: keyed("sk-test-key-123") })).toThrow(expect.objectContaining({ code: "AI_CONNECTION_MISMATCH" }));
  });

  it("keeps Gemini thinking low, gives local models longer limits than cloud APIs", () => {
    expect(languageModelOptions({ provider: "google", model: "m", connection: keyed("k") })).toEqual({ google: { thinkingConfig: { thinkingLevel: "low" } } });
    expect(languageModelOptions(ollama)).toBeUndefined();
    const cloud = languageModelTimeouts({ provider: "openai", model: "m", connection: keyed("k") });
    const localLimits = languageModelTimeouts(ollama);
    expect(localLimits.categorizeMs).toBeGreaterThan(cloud.categorizeMs);
    expect(localLimits.chatMs).toBeGreaterThan(cloud.chatMs);
  });
});

describe("Ollama", () => {
  it("talks to the OpenAI-compatible Chat Completions endpoint, never with the environment's OpenAI key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-real-openai-key");
    const fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => json(completion));
    vi.stubGlobal("fetch", fetcher);
    const { text } = await generateText({ model: createLanguageModel(ollama), prompt: "oi" });
    expect(text).toBe("ok");
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("http://localhost:11434/v1/chat/completions");
    expect(JSON.parse(String(init.body))).toMatchObject({ model: "qwen3:8b" });
    expect(JSON.stringify(init.headers)).not.toContain("sk-real-openai-key");
  });

  it("lists the installed models, sorted, without duplicates or ids the form would refuse", async () => {
    const fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => json({ models: [{ name: "qwen3:8b" }, { name: "gemma3:12b" }, { name: "qwen3:8b" }, { name: "bad name" }] }));
    vi.stubGlobal("fetch", fetcher);
    await expect(listOllamaModels(local)).resolves.toEqual([{ id: "gemma3:12b", label: "gemma3:12b" }, { id: "qwen3:8b", label: "qwen3:8b" }]);
    expect(fetcher.mock.calls[0][0]).toBe("http://localhost:11434/api/tags");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: "error", cache: "no-store" });
  });

  it.each([
    ["the server is down", async () => { throw new TypeError("fetch failed"); }],
    ["the server answers an error", async () => json({ error: "nope" }, 500)],
    ["the answer is not a model list", async () => json({ models: "qwen3:8b" })],
    ["the answer is not JSON", async () => new Response("<html>", { status: 200 })],
  ])("explains it cannot list the models when %s", async (_case, reply) => {
    vi.stubGlobal("fetch", vi.fn(reply));
    await expect(listOllamaModels(local)).rejects.toMatchObject({ code: "AI_MODELS_UNAVAILABLE", status: 502 });
  });
});

describe("server address", () => {
  it.each([
    ["http://localhost:11434", "http://localhost:11434"],
    ["http://localhost:11434//", "http://localhost:11434"],
    ["http://localhost:11434/v1", "http://localhost:11434"],
    ["not a url", null],
    ["javascript:alert(1)", null],
    ["http://localhost:11434/#top", null],
  ])("normalizes %s", (value, expected) => {
    expect(normalizeBaseUrl(value)).toBe(expected);
  });
});
