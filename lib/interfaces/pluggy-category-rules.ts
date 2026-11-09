import type { pluggyCategoryRuleDirections } from "@/lib/db/schema";

export type PluggyCategoryRuleDirection = (typeof pluggyCategoryRuleDirections)[number];

/** Category ids by direction and normalized description, holding only rules that can be applied. */
export type PluggyCategoryRuleIndex = Map<string, string>;

export type PluggyCategoryRuleTarget = { normalizedDescription: string; direction: PluggyCategoryRuleDirection };
export type PluggyCategoryRuleValues = PluggyCategoryRuleTarget & { categoryId: string };

export type PluggyPendingRecord = PluggyCategoryRuleTarget & {
  id: string;
  table: "transactions" | "credit_card_charges";
  amountCents: number;
  isCancelled: boolean;
};

export type PluggyPendingCategoryGroup = PluggyCategoryRuleTarget & { occurrences: number; totalCents: number };
export type PluggyPendingCategoriesResponse = { pending: PluggyPendingCategoryGroup[] };
