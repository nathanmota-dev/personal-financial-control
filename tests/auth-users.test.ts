import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase } from "./helpers/database";
import { getAuthDatabase } from "@/lib/auth/database";
import { authorizedUsers } from "@/lib/db/schema";
import { isAuthorizedEmail } from "@/lib/auth/users";

vi.mock("@/lib/db", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/db")>(), getDatabase: vi.fn() }));
import { getDatabase } from "@/lib/db";
afterEach(() => vi.unstubAllEnvs());

describe("Persistent authorization", () => {
  it("denies an empty database and reads changes without caching, using the shared client", async () => {
    const { db, databaseUrl, cleanup } = await createTestDatabase();
    vi.stubEnv("DATABASE_URL", databaseUrl);
    vi.mocked(getDatabase).mockReturnValue(db);
    try {
      expect(await isAuthorizedEmail("owner@example.com")).toBe(false);
      await getAuthDatabase().insert(authorizedUsers).values({ email: "owner@example.com" });
      expect(await isAuthorizedEmail("OWNER@example.com")).toBe(true);
      expect(await isAuthorizedEmail("other@example.com")).toBe(false);
      await getAuthDatabase().delete(authorizedUsers);
      expect(await isAuthorizedEmail("owner@example.com")).toBe(false);
    } finally { await cleanup(); }
  });
});
