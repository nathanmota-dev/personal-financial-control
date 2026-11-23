import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aiProviderCatalog, aiProviderConnectionKind, aiProviderDefaultBaseUrl, aiProviderLabel, aiProviderModels, isAiProvider, maskApiKey } from "@/lib/ai-model-catalog";
import { aiSettingsInputSchema } from "@/lib/server/ai/inputs";
import { deleteAiSettings, getAiSettingsView, saveAiSettings } from "@/lib/server/ai/settings";
import { DomainError } from "@/lib/server/errors";
import { createTestDatabase } from "@/tests/helpers/database";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

const KEY = "sk-test-1234567890abcd";
const db = () => database.db;
const keyed = (apiKey: string) => ({ kind: "apiKey", apiKey }) as const;
const local = (baseUrl: string) => ({ kind: "local", baseUrl }) as const;

beforeEach(async () => {
  vi.stubEnv("AI_PROVIDER", "");
  vi.stubEnv("AI_MODEL", "");
  vi.stubEnv("AI_API_KEY", "");
  vi.stubEnv("AI_BASE_URL", "");
  database = await createTestDatabase();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await database.cleanup();
});

describe("AI settings", () => {
  it("starts empty", async () => {
    expect(await getAiSettingsView(db())).toEqual({ provider: null, model: null, connection: null, source: null });
  });

  it("shows the environment configuration without its key", async () => {
    vi.stubEnv("AI_PROVIDER", "google");
    vi.stubEnv("AI_MODEL", "gemini-3.6-flash");
    vi.stubEnv("AI_API_KEY", "env-secret-wxyz");
    expect(await getAiSettingsView(db())).toEqual({ provider: "google", model: "gemini-3.6-flash", connection: { kind: "apiKey", keyMasked: "••••wxyz" }, source: "env" });
  });

  it("saves, masks the key and encrypts every value at rest", async () => {
    const view = await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) }, db());
    expect(view).toEqual({ provider: "google", model: "gemini-3.6-flash", connection: { kind: "apiKey", keyMasked: "••••abcd" }, source: "app" });
    const { rows } = await db().$client.execute("SELECT provider, model, connection FROM ai_settings");
    expect(rows).toHaveLength(1);
    for (const value of Object.values(rows[0])) expect(String(value)).toMatch(/^pfc:v2:/);
    expect(JSON.stringify(rows)).not.toMatch(/sk-test|gemini|google/);
  });

  it("requires a key on the first save", async () => {
    await expect(saveAiSettings({ provider: "google", model: "gemini-3.6-flash" }, db())).rejects.toMatchObject({ code: "AI_API_KEY_REQUIRED" });
  });

  it("keeps the stored key when it is omitted for the same provider", async () => {
    await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) }, db());
    const view = await saveAiSettings({ provider: "google", model: "gemini-3.8-flash" }, db());
    expect(view).toMatchObject({ model: "gemini-3.8-flash", connection: { keyMasked: "••••abcd" } });
    expect((await db().$client.execute("SELECT id FROM ai_settings")).rows).toHaveLength(1);
  });

  it("requires a new key when the provider changes", async () => {
    await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) }, db());
    await expect(saveAiSettings({ provider: "openai", model: "gpt-6-luna" }, db())).rejects.toBeInstanceOf(DomainError);
    expect(await saveAiSettings({ provider: "openai", model: "gpt-6-luna", connection: keyed("sk-other-9999") }, db())).toMatchObject({ provider: "openai", connection: { keyMasked: "••••9999" } });
  });

  it("saves a local server by its address, shown in full, and keeps it when it is omitted", async () => {
    const view = await saveAiSettings({ provider: "ollama", model: "qwen3:8b", connection: local("http://localhost:11434") }, db());
    expect(view).toEqual({ provider: "ollama", model: "qwen3:8b", connection: local("http://localhost:11434"), source: "app" });
    expect(await saveAiSettings({ provider: "ollama", model: "gemma3:12b" }, db())).toMatchObject({ model: "gemma3:12b", connection: local("http://localhost:11434") });
    const { rows } = await db().$client.execute("SELECT connection FROM ai_settings");
    expect(String(rows[0].connection)).toMatch(/^pfc:v2:/);
  });

  it("asks for the address of a local server on its first save", async () => {
    await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) }, db());
    await expect(saveAiSettings({ provider: "ollama", model: "qwen3:8b" }, db())).rejects.toMatchObject({ code: "AI_BASE_URL_REQUIRED" });
  });

  it.each([
    { provider: "ollama", model: "qwen3:8b", connection: keyed(KEY) },
    { provider: "google", model: "gemini-3.6-flash", connection: local("http://localhost:11434") },
  ] as const)("refuses a connection of the wrong kind for $provider", async (input) => {
    await expect(saveAiSettings(input, db())).rejects.toMatchObject({ code: "AI_CONNECTION_MISMATCH" });
  });

  it("falls back to the environment after removal", async () => {
    await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) }, db());
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("AI_MODEL", "deepseek-flash");
    vi.stubEnv("AI_API_KEY", "env-secret-wxyz");
    expect(await deleteAiSettings(db())).toMatchObject({ provider: "deepseek", source: "env" });
    expect((await db().$client.execute("SELECT id FROM ai_settings")).rows).toHaveLength(0);
  });
});

describe("AI settings input", () => {
  it.each([
    { provider: "mistral", model: "x", connection: keyed(KEY) },
    { provider: "google", model: "", connection: keyed(KEY) },
    { provider: "google", model: "gemini 3", connection: keyed(KEY) },
    { provider: "google", model: "gemini-3.6-flash", connection: keyed("short") },
    { provider: "google", model: "gemini-3.6-flash", connection: keyed("has a space inside") },
    { provider: "google", model: "gemini-3.6-flash", connection: { kind: "oauth", token: KEY } },
    { provider: "ollama", model: "qwen3:8b", connection: local("ftp://localhost:11434") },
    { provider: "ollama", model: "qwen3:8b", connection: local("localhost:11434") },
    { provider: "ollama", model: "qwen3:8b", connection: local("http://user:pass@localhost:11434") },
    { provider: "ollama", model: "qwen3:8b", connection: local("http://localhost:11434/?x=1") },
  ])("rejects %o", (input) => {
    expect(aiSettingsInputSchema.safeParse(input).success).toBe(false);
  });

  it("trims a pasted key and model", () => {
    expect(aiSettingsInputSchema.parse({ provider: "google", model: " gemini-3.6-flash ", connection: keyed(` ${KEY}\n`) })).toEqual({ provider: "google", model: "gemini-3.6-flash", connection: keyed(KEY) });
  });

  it.each([
    [" http://localhost:11434 ", "http://localhost:11434"],
    ["http://localhost:11434/", "http://localhost:11434"],
    ["http://gpu-box:11434/v1/", "http://gpu-box:11434"],
    ["https://ollama.example/proxy/v1", "https://ollama.example/proxy"],
  ])("normalizes the server address %s", (baseUrl, expected) => {
    expect(aiSettingsInputSchema.parse({ provider: "ollama", model: "qwen3:8b", connection: local(baseUrl) }).connection).toEqual(local(expected));
  });
});

describe("AI model catalog", () => {
  it("lists models for every provider", () => {
    for (const entry of aiProviderCatalog) {
      // A local provider has no fixed list: its models are read from the server.
      expect(aiProviderModels(entry.provider).length > 0).toBe(entry.connectionKind === "apiKey");
      expect(aiProviderLabel(entry.provider)).toBe(entry.label);
      expect(aiProviderConnectionKind(entry.provider)).toBe(entry.connectionKind);
      expect(isAiProvider(entry.provider)).toBe(true);
    }
    expect(aiProviderDefaultBaseUrl("ollama")).toBe("http://localhost:11434");
    expect(aiProviderDefaultBaseUrl("google")).toBe("");
    expect(isAiProvider("mistral")).toBe(false);
    expect(maskApiKey("abcdef123")).toBe("••••f123");
  });
});
