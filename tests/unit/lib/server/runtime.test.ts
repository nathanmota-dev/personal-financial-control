import { afterEach, expect, it, vi } from "vitest";
import { getFinanceDefaultMonth, getFinanceToday } from "@/lib/server/runtime";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
it("uses the fixed demo reference and the real clock outside demo", () => {
  vi.stubEnv("DEMO_MODE", "true");
  expect(getFinanceToday()).toBe("2026-07-16");
  expect(getFinanceDefaultMonth()).toBe("2026-07");
  vi.stubEnv("DEMO_MODE", "false");
  vi.stubEnv("DATABASE_URL", "file:test.db");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
  expect(getFinanceToday()).toBe("2027-01-01");
  expect(getFinanceDefaultMonth()).toBe("2027-01");
});
