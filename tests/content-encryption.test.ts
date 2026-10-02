import { createClient } from "@libsql/client";
import { migrateDatabase } from "@/lib/db/migrate";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { contentIndex, decryptContent, encryptContent, type ContentType } from "@/lib/crypto/content";
import * as schema from "@/lib/db/schema";
import { createTestDatabase } from "@/tests/helpers/database";

const key = Buffer.alloc(32, 7);
beforeEach(() => { process.env.DATA_ENCRYPTION_KEY = key.toString("base64"); });
describe("authenticated content", () => {
  it("round-trips Unicode, empty text, flags, signed integers and exact timestamps", () => {
    for (const [type, value] of [["text", ""], ["text", "Olá 日本語 🦉"], ["boolean", true], ["boolean", false], ["integer", 0], ["integer", -123], ["timestamp", new Date(1780300012345)]] as const) {
      const first = encryptContent(value, "table.column", type, key);
      expect(decryptContent(first, "table.column", type, key)).toEqual(value);
      expect(encryptContent(value, "table.column", type, key)).not.toBe(first);
      expect(() => decryptContent(first, "other.column", type, key)).toThrow();
      expect(() => decryptContent(first, "table.column", type, Buffer.alloc(32, 8))).toThrow();
      expect(() => decryptContent(first, "table.column", (type === "text" ? "integer" : "text") as ContentType, key)).toThrow();
      const parts = first.split(":"); const bytes = Buffer.from(parts[3], "base64url"); bytes[0] ^= 1; parts[3] = bytes.toString("base64url");
      expect(() => decryptContent(parts.join(":"), "table.column", type, key)).toThrow();
    }
    for (const payload of ["plaintext", "pfc:v1:legacy", "pfc:v2:!::", "pfc:v2:invalid"]) expect(() => decryptContent(payload, "table.column", "text", key)).toThrow();
    expect(() => encryptContent(0.5, "table.column", "integer", key)).toThrow();
    expect(contentIndex(["name"], "accounts.name", key)).toBe(contentIndex(["name"], "accounts.name", key));
    expect(contentIndex(["name"], "categories.name", key)).not.toBe(contentIndex(["name"], "accounts.name", key));
  });
  it("initializes encrypted seed data directly and preserves an existing database", async () => {
    const fixture = await createTestDatabase();
    try {
      const before = await fixture.db.$client.execute("SELECT * FROM categories ORDER BY id");
      expect(before.rows).toHaveLength(7);
      for (const row of before.rows) for (const column of ["name", "group", "is_archived", "created_at", "updated_at"]) expect(row[column]).toMatch(/^pfc:v2:/);
      const history = await fixture.db.$client.execute("SELECT * FROM __drizzle_migrations ORDER BY id");
      await migrateDatabase(fixture.db.$client);
      expect(await fixture.db.$client.execute("SELECT * FROM categories ORDER BY id")).toEqual(before);
      expect(await fixture.db.$client.execute("SELECT * FROM __drizzle_migrations ORDER BY id")).toEqual(history);
    } finally { fixture.db.$client.close(); await fixture.cleanup(); }
  });
  it("rejects legacy databases without changing their data", async () => {
    const client = createClient({ url: "file::memory:" });
    try {
      await client.execute("CREATE TABLE accounts (id TEXT PRIMARY KEY, name TEXT)");
      await client.execute("INSERT INTO accounts VALUES ('legacy', 'Checking')");
      await expect(migrateDatabase(client)).rejects.toThrow("Legacy data conversion is no longer supported");
      expect((await client.execute("SELECT * FROM accounts")).rows).toEqual([{ id: "legacy", name: "Checking" }]);
      expect((await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'")).rows).toEqual([{ name: "accounts" }]);
    } finally { client.close(); }
  });
  it("maintains conditional uniqueness when archiving and unarchiving records", async () => {
    const fixture = await createTestDatabase();
    try {
      const holding = { name: "Asset", quoteSymbol: " abcd3 ", assetClass: "equities" as const, instrumentType: "stock" as const, currentValueCents: 100, valueAsOf: "2026-10-01" };
      const [first] = await fixture.db.insert(schema.investmentHoldings).values(holding).returning();
      expect(first).not.toHaveProperty("activeQuoteSymbolHash");
      await expect(fixture.db.insert(schema.investmentHoldings).values({ ...holding, quoteSymbol: "ABCD3" })).rejects.toThrow();
      await fixture.db.update(schema.investmentHoldings).set({ isArchived: true }).where(eq(schema.investmentHoldings.id, first.id));
      await fixture.db.insert(schema.investmentHoldings).values({ ...holding, quoteSymbol: "ABCD3" });
      await expect(fixture.db.update(schema.investmentHoldings).set({ isArchived: false }).where(eq(schema.investmentHoldings.id, first.id))).rejects.toThrow();
      const [purpose] = await fixture.db.insert(schema.investmentPurposes).values({ name: "Reserve", kind: "emergency_reserve" }).returning();
      await expect(fixture.db.insert(schema.investmentPurposes).values({ name: "Second", kind: "emergency_reserve" })).rejects.toThrow();
      await fixture.db.update(schema.investmentPurposes).set({ isArchived: true }).where(eq(schema.investmentPurposes.id, purpose.id));
      await fixture.db.insert(schema.investmentPurposes).values({ name: "Second", kind: "emergency_reserve" });
      await fixture.db.insert(schema.accounts).values({ name: "Checking", type: "checking", initialBalanceCents: 0 });
      await expect(fixture.db.$client.execute("INSERT INTO accounts (id, name, type, initial_balance_cents, credit_due_day, is_archived, created_at, updated_at) SELECT 'missing-hash', name, type, initial_balance_cents, credit_due_day, is_archived, created_at, updated_at FROM accounts LIMIT 1")).rejects.toThrow();
    } finally { fixture.db.$client.close(); await fixture.cleanup(); }
  });
});
