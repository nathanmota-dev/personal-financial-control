import indexes from "@/lib/db/encryption-indexes.json";
import inventory from "@/lib/db/encryption-inventory.json";
import { getTableName,sql } from "drizzle-orm";
import { check,type SQLiteColumn } from "drizzle-orm/sqlite-core";

export function encryptionChecks(columns: Record<string, SQLiteColumn>) {
  const name = getTableName(Object.values(columns)[0].table);
  const classified = inventory[name as keyof typeof inventory] as Record<string, string> | undefined;
  if (!classified) throw new Error(`Unclassified business table: ${name}`);
  const actual = new Set(Object.values(columns).map((column) => column.name));
  for (const column of Object.keys(classified)) {
    if (!actual.has(column)) throw new Error(`Missing classified column: ${name}.${column}`);
  }
  return Object.values(columns).flatMap((column) => {
    if (column.name.endsWith("_hash")) {
      const sources = (indexes as Record<string, string[]>)[name] ?? [];
      const source = column.name.slice(0, -5);
      const conditional = (name === "investment_holdings" && column.name === "active_quote_symbol_hash") || (name === "investment_purposes" && column.name === "active_emergency_hash");
      if (!sources.includes(source) && !conditional) throw new Error(`Unclassified technical index: ${name}.${column.name}`);
      const rules = [check(`${name}_${column.name}_valid`, sql`${column} IS NULL OR (length(${column}) = 64 AND ${column} NOT GLOB '*[^0-9a-f]*')`)];
      const business = Object.values(columns).find((item) => item.name === source);
      if (business) rules.push(check(`${name}_${column.name}_present`, sql`(${business} IS NULL) = (${column} IS NULL)`));
      return rules;
    }
    const type = classified[column.name];
    if (!type) throw new Error(`Unclassified business column: ${name}.${column.name}`);
    if (type === "technical") return [];
    return [check(`${name}_${column.name}_encrypted`, sql`${column} IS NULL OR (typeof(${column}) = 'text' AND ${column} LIKE 'pfc:v2:%')`)];
  });
}
