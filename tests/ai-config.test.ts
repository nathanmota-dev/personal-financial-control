import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAiConfig, resetAiConfigWarning } from "@/lib/server/ai/config";
import { saveAiSettings } from "@/lib/server/ai/settings";
import { createTestDatabase } from "@/tests/helpers/database";

let warn: ReturnType<typeof vi.spyOn>;
let database: Awaited<ReturnType<typeof createTestDatabase>>;

const config = () => getAiConfig(database.db);

function setAi(provider: string, model: string, apiKey: string) {
  vi.stubEnv("AI_PROVIDER", provider);
  vi.stubEnv("AI_MODEL", model);
  vi.stubEnv("AI_API_KEY", apiKey);
}

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
    expect(await config()).toEqual({ provider: "google", model: "gemini-test", apiKey: "secret" });
  });

  it("is off with a warning when only part of it is set, without naming the key", async () => {
    setAi("google", "", "secret");
    expect(await config()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).not.toContain("secret");
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
    await saveAiSettings({ provider: "anthropic", model: "claude-haiku-5-5", apiKey: "app-secret-key" }, database.db);
    expect(await config()).toEqual({ provider: "anthropic", model: "claude-haiku-5-5", apiKey: "app-secret-key" });
  });

  it("works without any environment variable", async () => {
    setAi("", "", "");
    await saveAiSettings({ provider: "deepseek", model: "deepseek-flash", apiKey: "app-secret-key" }, database.db);
    expect(await config()).toMatchObject({ provider: "deepseek" });
  });

  it("is off in demo mode even when saved", async () => {
    await saveAiSettings({ provider: "openai", model: "gpt-6-luna", apiKey: "app-secret-key" }, database.db);
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
});
