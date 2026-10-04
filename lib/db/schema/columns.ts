import type { ForeignKeyDeleteAction } from "@/lib/interfaces/database";
import { text,type AnySQLiteColumn } from "drizzle-orm/sqlite-core";

export function recordId() {
  return text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
}

export function referenceColumn<TName extends string>(
  name: TName,
  reference: () => AnySQLiteColumn,
  onDelete: ForeignKeyDeleteAction,
) {
  return text(name).references(reference, { onDelete });
}
