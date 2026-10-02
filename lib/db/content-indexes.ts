import { getTableColumns, getTableName } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { contentIndex } from "@/lib/crypto/content";

export function withContentIndexes(table: SQLiteTable, values: Record<string, unknown>, defaults = false) {
  const columns = getTableColumns(table);
  const row = { ...values };
  if (defaults) for (const [key, column] of Object.entries(columns)) {
    if (row[key] === undefined && column.defaultFn) row[key] = column.defaultFn();
  }
  const tableName = getTableName(table);
  for (const [key, column] of Object.entries(columns)) {
    if (!column.name.endsWith("_hash")) continue;
    if (key === "activeQuoteSymbolHash") row[key] = !row.isArchived && row.quoteSymbol != null ? contentIndex([(row.quoteSymbol as string).trim().toUpperCase()], `${tableName}.active_quote_symbol`) : null;
    else if (key === "activeEmergencyHash") row[key] = !row.isArchived && row.kind === "emergency_reserve" ? contentIndex(["emergency_reserve"], `${tableName}.active_emergency`) : null;
    else {
      const source = column.name.slice(0, -5);
      const property = Object.entries(columns).find(([, item]) => item.name === source)?.[0];
      if (!property) throw new Error(`Invalid content index ${tableName}.${column.name}`);
      row[key] = row[property] == null ? null : contentIndex([row[property]], `${tableName}.${source}`);
    }
  }
  return row;
}
