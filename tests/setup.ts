import { vi } from "vitest";
vi.mock("server-only", () => ({}));
// Isolated test credential, never used by the application runtime.
process.env.DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
// A developer's .env may enable AI categorization; tests must never reach a real provider.
// @next/env keeps values that are already set, so these empty ones win. Tests enable it with vi.stubEnv.
process.env.AI_PROVIDER = "";
process.env.AI_MODEL = "";
process.env.AI_API_KEY = "";
