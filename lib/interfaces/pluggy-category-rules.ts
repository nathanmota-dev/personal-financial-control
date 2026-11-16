import type { pluggyCategoryRuleDirections } from "@/lib/db/schema";

export type PluggyCategoryRuleDirection = (typeof pluggyCategoryRuleDirections)[number];

/** Category ids by direction and normalized description, holding only rules that can be applied. */
export type PluggyCategoryRuleIndex = Map<string, string>;

export type PluggyCategoryRuleTarget = { normalizedDescription: string; direction: PluggyCategoryRuleDirection };
export type PluggyCategoryRuleValues = PluggyCategoryRuleTarget & { categoryId: string };

export type PluggyPendingRecord = PluggyCategoryRuleTarget & {
  id: string;
  table: "transactions" | "credit_card_charges";
  /** The bank's text before normalization. */
  description: string;
  amountCents: number;
  isCancelled: boolean;
};

/** A pending AI suggestion that still points at a usable category. */
export type PluggyCategorySuggestionView = { categoryId: string; reason: string | null };

export type PluggyPendingCategoryGroup = PluggyCategoryRuleTarget & {
  occurrences: number;
  totalCents: number;
  /** Only present when AI categorization suggested a category for this description. */
  suggestion?: PluggyCategorySuggestionView;
};
export type PluggyPendingCategoriesResponse = { pending: PluggyPendingCategoryGroup[] };
