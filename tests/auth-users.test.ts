import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase } from "./helpers/database";
import { authorizedUsers } from "@/lib/db/schema";
import { isAuthorizedEmail } from "@/lib/auth/users";

afterEach(() => vi.unstubAllEnvs());

describe("Persistent authorization", () => {
  it("denies an empty database and reads changes without caching, also in demo mode", async () => {
    const { db, databaseUrl, cleanup } = await createTestDatabase();
    vi.stubEnv("DATABASE_URL", databaseUrl);
    vi.stubEnv("DEMO_MODE", "true");
    try {
      expect(await isAuthorizedEmail("owner@example.com")).toBe(false);
      await db.insert(authorizedUsers).values({ email: "owner@example.com" });
      expect(await isAuthorizedEmail("OWNER@example.com")).toBe(true);
      expect(await isAuthorizedEmail("other@example.com")).toBe(false);
      await db.delete(authorizedUsers);
      expect(await isAuthorizedEmail("owner@example.com")).toBe(false);
    } finally { await cleanup(); }
  });
});
