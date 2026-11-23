import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { aiSettings } from "@/lib/db/schema";
import { getAiConfig, resetAiConfigWarning } from "@/lib/server/ai/config";
import { saveAiSettings } from "@/lib/server/ai/settings";
import { createTestDatabase } from "@/tests/helpers/database";

let warn: ReturnType<typeof vi.spyOn>;
let database: Awaited<ReturnType<typeof createTestDatabase>>;

const config = () => getAiConfig(database.db);

function setAi(provider: string, model: string, apiKey: string, baseUrl = "") {
  vi.stubEnv("AI_PROVIDER", provider);
  vi.stubEnv("AI_MODEL", model);
  vi.stubEnv("AI_API_KEY", apiKey);
  vi.stubEnv("AI_BASE_URL", baseUrl);
}

const keyed = (apiKey: string) => ({ kind: "apiKey", apiKey }) as const;

beforeEach(async () => {
  resetAiConfigWarning();
  vi.stubEnv("DEMO_MODE", "false");
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  database = await createTestDatabase();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await database.cleanup();
});

describe("AI configuration from the environment", () => {
  it("is off and silent when nothing is set", async () => {
    setAi("", "", "");
    expect(await config()).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns the configuration when all three values are set", async () => {
    setAi(" Google ", "gemini-test", "secret");
    expect(await config()).toEqual({ provider: "google", model: "gemini-test", connection: keyed("secret") });
  });

  it("is off with a warning when only part of it is set, without naming the key", async () => {
    setAi("google", "", "secret");
    expect(await config()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).not.toContain("secret");
  });

  it("is off with a warning, naming AI_API_KEY, when a cloud provider has no key", async () => {
    setAi("openai", "gpt-6-luna", "");
    expect(await config()).toBeNull();
    expect(String(warn.mock.calls[0][0])).toContain("AI_API_KEY");
  });

  it("reaches Ollama at its default address without any key", async () => {
    setAi("ollama", "qwen3:8b", "");
    expect(await config()).toEqual({ provider: "ollama", model: "qwen3:8b", connection: { kind: "local", baseUrl: "http://localhost:11434" } });
    expect(warn).not.toHaveBeenCalled();
  });

  it("normalizes AI_BASE_URL, so the OpenAI-compatible endpoint can be pasted", async () => {
    setAi("ollama", "qwen3:8b", "", "http://gpu-box:11434/v1/");
    expect(await config()).toMatchObject({ connection: { kind: "local", baseUrl: "http://gpu-box:11434" } });
  });

  it("is off with a warning for an invalid AI_BASE_URL", async () => {
    setAi("ollama", "qwen3:8b", "", "ftp://gpu-box");
    expect(await config()).toBeNull();
    expect(String(warn.mock.calls[0][0])).toContain("AI_BASE_URL");
  });

  it("is off with a warning for an unknown provider", async () => {
    setAi("mistral", "model", "secret");
    expect(await config()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("warns only once per process", async () => {
    setAi("google", "", "");
    await config();
    await config();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("is always off in demo mode", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    setAi("google", "gemini-test", "secret");
    expect(await config()).toBeNull();
  });
});

describe("AI configuration saved in Settings", () => {
  it("takes precedence over the environment", async () => {
    setAi("google", "gemini-env", "env-secret");
    await saveAiSettings({ provider: "anthropic", model: "claude-haiku-5-5", connection: keyed("app-secret-key") }, database.db);
    expect(await config()).toEqual({ provider: "anthropic", model: "claude-haiku-5-5", connection: keyed("app-secret-key") });
  });

  it("works without any environment variable", async () => {
    setAi("", "", "");
    await saveAiSettings({ provider: "deepseek", model: "deepseek-flash", connection: keyed("app-secret-key") }, database.db);
    expect(await config()).toMatchObject({ provider: "deepseek" });
  });

  it("is off in demo mode even when saved", async () => {
    await saveAiSettings({ provider: "openai", model: "gpt-6-luna", connection: keyed("app-secret-key") }, database.db);
    vi.stubEnv("DEMO_MODE", "true");
    expect(await config()).toBeNull();
  });

  it("turns off with a warning, instead of using the environment, when the saved key cannot be read", async () => {
    setAi("google", "gemini-env", "env-secret");
    const now = "pfc:v2:AAAA:AAAA:AAAA";
    await database.db.$client.execute({ sql: "INSERT INTO ai_settings VALUES ('row', ?, ?, ?, ?, ?)", args: [now, now, now, now, now] });
    expect(await config()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("não pôde ser lida");
  });

  it.each([
    ["a connection of another kind", JSON.stringify(keyed("app-secret-key"))],
    ["a connection that is not JSON", "not-json"],
  ])("turns off with a warning when the saved row holds %s", async (_case, connection) => {
    setAi("", "", "");
    await database.db.insert(aiSettings).values({ provider: "ollama", model: "qwen3:8b", connection });
    expect(await config()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
