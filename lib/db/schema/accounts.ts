import { encryptedBoolean,encryptedInteger,encryptedText,encryptedTimestamp } from "@/lib/db/encrypted-content";
import { encryptionChecks } from "@/lib/db/encryption-checks";
import {
sqliteTable,
text,
uniqueIndex
} from "drizzle-orm/sqlite-core";
import { recordId } from "./columns";
import { accountTypes,categoryGroups } from "./enums";

export function timestampColumns(table: string) {
  return {
    createdAt: encryptedTimestamp("created_at", `${table}.created_at`).notNull().$defaultFn(() => new Date()),
    updatedAt: encryptedTimestamp("updated_at", `${table}.updated_at`).notNull().$defaultFn(() => new Date()),
  };
}

export const accounts = sqliteTable(
  "accounts",
  {
    id: recordId(),
    name: encryptedText("name", "accounts.name").notNull(),
    type: encryptedText("type", "accounts.type", { enum: accountTypes }).notNull(),
    initialBalanceCents: encryptedInteger("initial_balance_cents", "accounts.initial_balance_cents").notNull(),
    creditClosingDay: encryptedInteger("credit_closing_day", "accounts.credit_closing_day"),
    creditDueDay: encryptedInteger("credit_due_day", "accounts.credit_due_day").notNull().$defaultFn(() => 10),
    isArchived: encryptedBoolean("is_archived", "accounts.is_archived").notNull().$defaultFn(() => false),
    nameHash: text("name_hash"),
    ...timestampColumns("accounts"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("accounts_name_unique").on(table.nameHash),
  ]
);

export const categories = sqliteTable(
  "categories",
  {
    id: recordId(),
    name: encryptedText("name", "categories.name").notNull(),
    group: encryptedText("group", "categories.group", { enum: categoryGroups }).notNull(),
    isArchived: encryptedBoolean("is_archived", "categories.is_archived").notNull().$defaultFn(() => false),
    nameHash: text("name_hash"),
    ...timestampColumns("categories"),
  },
  (table) => [
    ...encryptionChecks(table),
    uniqueIndex("categories_name_unique").on(table.nameHash)]
);
