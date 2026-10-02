import { vi } from "vitest";
vi.mock("server-only", () => ({}));
// Isolated test credential, never used by the application runtime.
process.env.DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
