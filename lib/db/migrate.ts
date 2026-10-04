import type { Client,InStatement,InValue } from "@libsql/client";
import { getTableColumns } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { join } from "node:path";

import { defaultCategories } from "@/lib/category-defaults";
import { withContentIndexes } from "@/lib/db/content-indexes";
import { categories } from "@/lib/db/schema";

const encryptedSchemaVersion = 1790400000000;

export async function migrateDatabase(client: Client) {
  const migrations = readMigrationFiles({
    migrationsFolder: join(process.cwd(), "drizzle"),
  });
  const objects = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  );
  const tables = new Set(objects.rows.map((row) => String(row.name)));
  const history = tables.has("__drizzle_migrations")
    ? await client.execute("SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1")
    : undefined;
  const latest = Number(history?.rows[0]?.created_at ?? 0);

  if (latest < encryptedSchemaVersion) {
    if ([...tables].some((table) => table !== "__drizzle_migrations")) {
      throw new Error("This database requires the completed content encryption schema. Legacy data conversion is no longer supported.");
    }
    const schema = migrations.find((migration) => migration.folderMillis === encryptedSchemaVersion);
    if (!schema) throw new Error("Encrypted database schema is missing.");
    const statements: InStatement[] = [
      "CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT NOT NULL, created_at NUMERIC)",
      ...schema.sql,
      "CREATE TABLE __pfc_content_migration (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL, source_digest TEXT NOT NULL)",
      "INSERT INTO __pfc_content_migration VALUES (1, 2, 'bootstrap')",
    ];
    const columns = getTableColumns(categories);
    for (const category of defaultCategories) {
      const row = withContentIndexes(categories, category, true);
      const entries = Object.entries(columns);
      statements.push({
        sql: `INSERT INTO categories (${entries.map(([, column]) => `"${column.name}"`).join(",")}) VALUES (${entries.map(() => "?").join(",")})`,
        args: entries.map(([key, column]) => row[key] == null ? null : column.mapToDriverValue(row[key]) as InValue),
      });
    }
    statements.push(...migrations.filter((migration) => migration.folderMillis <= encryptedSchemaVersion && migration.folderMillis > latest).map((migration) => ({
      sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      args: [migration.hash, migration.folderMillis],
    })));
    await client.migrate(statements);
  }

  const pending = migrations.filter((migration) => migration.folderMillis > Math.max(latest, encryptedSchemaVersion));
  if (pending.length) {
    await client.migrate(pending.flatMap((migration) => [
      ...migration.sql,
      { sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)", args: [migration.hash, migration.folderMillis] },
    ]));
  }
}
