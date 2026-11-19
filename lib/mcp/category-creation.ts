import type { AppDb } from "@/lib/db";
import { PENDING_CATEGORY_NAME } from "@/lib/pending-category";
import { createCategory, listCategories } from "@/lib/server/categories";
import { DomainError } from "@/lib/server/errors";
import { z } from "zod";

export const mcpCategoryInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  group: z.enum(["income", "fixed_expense", "variable_expense", "investment"]),
  description: z.string().trim().max(200).optional(),
});

export type McpCategoryInput = z.infer<typeof mcpCategoryInputSchema>;

const sameName = (left: string, right: string) => left.localeCompare(right, "pt-BR", { sensitivity: "base" }) === 0;

/**
 * Repeating the same name and group returns the active category instead of a duplicate.
 * Names differing only in case or accents count as taken, so a model cannot fork "Mercado" into "mercado".
 */
export async function createMcpCategory(input: McpCategoryInput, database?: AppDb) {
  if (sameName(input.name, PENDING_CATEGORY_NAME)) {
    throw new DomainError("CATEGORY_RESERVED", `"${PENDING_CATEGORY_NAME}" is reserved for records not classified yet.`);
  }
  const existing = (await listCategories({ includeArchived: true }, database)).find((category) => sameName(category.name, input.name));
  if (!existing) return { ...(await createCategory(input, database)), created: true };
  if (existing.name === input.name && existing.group === input.group && !existing.isArchived) return { ...existing, created: false };
  throw new DomainError("CATEGORY_NAME_TAKEN", `Category "${existing.name}" already exists${existing.isArchived ? " (archived)" : ""} in group ${existing.group}.`);
}
