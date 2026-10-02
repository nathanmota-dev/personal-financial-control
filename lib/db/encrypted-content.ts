import { customType } from "drizzle-orm/sqlite-core";
import { decryptContent, encryptContent } from "@/lib/crypto/content";
import type { ContentType, ContentValue } from "@/lib/crypto/content";

function column<T extends ContentValue>(name: string, context: string, type: ContentType) {
  return customType<{ data: T; driverData: string }>({
    dataType: () => "text",
    toDriver: (value) => encryptContent(value, context, type),
    fromDriver: (value) => decryptContent(value, context, type) as T,
  })(name);
}
export function encryptedText<T extends string = string>(name: string, context: string, options?: { enum: readonly T[] }) {
  void options;
  return column<T>(name, context, "text");
}
export function encryptedInteger(name: string, context: string) { return column<number>(name, context, "integer"); }
export function encryptedBoolean(name: string, context: string) { return column<boolean>(name, context, "boolean"); }
export function encryptedTimestamp(name: string, context: string) { return column<Date>(name, context, "timestamp"); }
