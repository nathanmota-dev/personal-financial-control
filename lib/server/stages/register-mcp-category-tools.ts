import { getFinanceDatabase } from "@/lib/db";
import type { RegisterMcpCategoryToolsContext } from "@/lib/interfaces/stages/register-mcp-category-tools";
import { createMcpCategory, mcpCategoryInputSchema } from "@/lib/mcp/category-creation";
import { createAnnotations, readAnnotations } from "@/lib/mcp/tool-support";
import { pluggyCategoryRuleDirections } from "@/lib/db/schema";
import { applyPendingCategory, listPendingCategoryGroups } from "@/lib/server/pluggy/category-review";
import { normalizeDescription } from "@/lib/server/pluggy/normalize-description";
import { z } from "zod";

export function registerMcpCategoryTools({ server, handler, database }: RegisterMcpCategoryToolsContext) {
  const resolveDb = async () => database ?? getFinanceDatabase();

  server.registerTool("list_pending_categories", {
    description: "List bank-synced records still waiting for a category, grouped by normalized description and direction, largest totals first. Each group may carry an AI suggestion.",
    inputSchema: z.object({}),
    annotations: readAnnotations,
  }, handler(async () => listPendingCategoryGroups(await resolveDb())));

  server.registerTool("apply_pending_category", {
    description: "Categorize every pending record of one group from list_pending_categories and remember the choice, so future syncs of that description are categorized automatically.",
    inputSchema: z.object({
      normalizedDescription: z.string().trim().min(1).max(500),
      direction: z.enum(pluggyCategoryRuleDirections),
      categoryId: z.string().uuid(),
    }),
    annotations: createAnnotations,
  }, handler(async (input) => {
    // Normalizing again is harmless for a listed group and lets a raw bank description match it too.
    const target = { ...input, normalizedDescription: normalizeDescription(input.normalizedDescription) };
    const { applied, pending } = await applyPendingCategory(target, await resolveDb());
    return { applied, remainingGroups: pending.length };
  }));

  server.registerTool("create_category", {
    description: "Create a category when no existing one fits. Repeating the same name and group returns the existing category with created=false.",
    inputSchema: mcpCategoryInputSchema,
    annotations: createAnnotations,
  }, handler(async (input) => createMcpCategory(input, database)));
}
