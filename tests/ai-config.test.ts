import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAiConfig, resetAiConfigWarning } from "@/lib/server/ai/config";

let warn: ReturnType<typeof vi.spyOn>;

function setAi(provider: string, model: string, apiKey: string) {
  vi.stubEnv("AI_PROVIDER", provider);
  vi.stubEnv("AI_MODEL", model);
  vi.stubEnv("AI_API_KEY", apiKey);
}

beforeEach(() => {
  resetAiConfigWarning();
  vi.stubEnv("DEMO_MODE", "false");
  warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("AI configuration", () => {
  it("is off and silent when nothing is set", () => {
    setAi("", "", "");
    expect(getAiConfig()).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it("returns the configuration when all three values are set", () => {
    setAi(" Google ", "gemini-test", "secret");
    expect(getAiConfig()).toEqual({ provider: "google", model: "gemini-test", apiKey: "secret" });
  });

  it("is off with a warning when only part of it is set, without naming the key", () => {
    setAi("google", "", "secret");
    expect(getAiConfig()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).not.toContain("secret");
  });

  it("is off with a warning for an unknown provider", () => {
    setAi("mistral", "model", "secret");
    expect(getAiConfig()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("warns only once per process", () => {
    setAi("google", "", "");
    getAiConfig();
    getAiConfig();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("is always off in demo mode", () => {
    vi.stubEnv("DEMO_MODE", "true");
    setAi("google", "gemini-test", "secret");
    expect(getAiConfig()).toBeNull();
  });
});
