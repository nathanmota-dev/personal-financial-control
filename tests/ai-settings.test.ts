import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aiProviderCatalog, aiProviderLabel, aiProviderModels, isAiProvider, maskApiKey } from "@/lib/ai-model-catalog";
import { aiSettingsInputSchema } from "@/lib/server/ai/inputs";
import { deleteAiSettings, getAiSettingsView, saveAiSettings } from "@/lib/server/ai/settings";
import { DomainError } from "@/lib/server/errors";
import { createTestDatabase } from "@/tests/helpers/database";

let database: Awaited<ReturnType<typeof createTestDatabase>>;

const KEY = "sk-test-1234567890abcd";
const db = () => database.db;

beforeEach(async () => {
  vi.stubEnv("AI_PROVIDER", "");
  vi.stubEnv("AI_MODEL", "");
  vi.stubEnv("AI_API_KEY", "");
  database = await createTestDatabase();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await database.cleanup();
});

describe("AI settings", () => {
  it("starts empty", async () => {
    expect(await getAiSettingsView(db())).toEqual({ provider: null, model: null, keyMasked: null, source: null });
  });

  it("shows the environment configuration without its key", async () => {
    vi.stubEnv("AI_PROVIDER", "google");
    vi.stubEnv("AI_MODEL", "gemini-3.6-flash");
    vi.stubEnv("AI_API_KEY", "env-secret-wxyz");
    expect(await getAiSettingsView(db())).toEqual({ provider: "google", model: "gemini-3.6-flash", keyMasked: "••••wxyz", source: "env" });
  });

  it("saves, masks the key and encrypts every value at rest", async () => {
    const view = await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", apiKey: KEY }, db());
    expect(view).toEqual({ provider: "google", model: "gemini-3.6-flash", keyMasked: "••••abcd", source: "app" });
    const { rows } = await db().$client.execute("SELECT provider, model, api_key FROM ai_settings");
    expect(rows).toHaveLength(1);
    for (const value of Object.values(rows[0])) expect(String(value)).toMatch(/^pfc:v2:/);
    expect(JSON.stringify(rows)).not.toMatch(/sk-test|gemini|google/);
  });

  it("requires a key on the first save", async () => {
    await expect(saveAiSettings({ provider: "google", model: "gemini-3.6-flash" }, db())).rejects.toMatchObject({ code: "AI_API_KEY_REQUIRED" });
  });

  it("keeps the stored key when it is omitted for the same provider", async () => {
    await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", apiKey: KEY }, db());
    const view = await saveAiSettings({ provider: "google", model: "gemini-3.8-flash" }, db());
    expect(view).toMatchObject({ model: "gemini-3.8-flash", keyMasked: "••••abcd" });
    expect((await db().$client.execute("SELECT id FROM ai_settings")).rows).toHaveLength(1);
  });

  it("requires a new key when the provider changes", async () => {
    await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", apiKey: KEY }, db());
    await expect(saveAiSettings({ provider: "openai", model: "gpt-6-luna" }, db())).rejects.toBeInstanceOf(DomainError);
    expect(await saveAiSettings({ provider: "openai", model: "gpt-6-luna", apiKey: "sk-other-9999" }, db())).toMatchObject({ provider: "openai", keyMasked: "••••9999" });
  });

  it("falls back to the environment after removal", async () => {
    await saveAiSettings({ provider: "google", model: "gemini-3.6-flash", apiKey: KEY }, db());
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("AI_MODEL", "deepseek-flash");
    vi.stubEnv("AI_API_KEY", "env-secret-wxyz");
    expect(await deleteAiSettings(db())).toMatchObject({ provider: "deepseek", source: "env" });
    expect((await db().$client.execute("SELECT id FROM ai_settings")).rows).toHaveLength(0);
  });
});

describe("AI settings input", () => {
  it.each([
    { provider: "mistral", model: "x", apiKey: KEY },
    { provider: "google", model: "", apiKey: KEY },
    { provider: "google", model: "gemini 3", apiKey: KEY },
    { provider: "google", model: "gemini-3.6-flash", apiKey: "short" },
    { provider: "google", model: "gemini-3.6-flash", apiKey: "has a space inside" },
  ])("rejects %o", (input) => {
    expect(aiSettingsInputSchema.safeParse(input).success).toBe(false);
  });

  it("trims a pasted key and model", () => {
    expect(aiSettingsInputSchema.parse({ provider: "google", model: " gemini-3.6-flash ", apiKey: ` ${KEY}\n` })).toEqual({ provider: "google", model: "gemini-3.6-flash", apiKey: KEY });
  });
});

describe("AI model catalog", () => {
  it("lists models for every provider", () => {
    for (const entry of aiProviderCatalog) {
      expect(aiProviderModels(entry.provider).length).toBeGreaterThan(0);
      expect(aiProviderLabel(entry.provider)).toBe(entry.label);
      expect(isAiProvider(entry.provider)).toBe(true);
    }
    expect(isAiProvider("mistral")).toBe(false);
    expect(maskApiKey("abcdef123")).toBe("••••f123");
  });
});
