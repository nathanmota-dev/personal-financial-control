import type { generateText } from "ai";

import type { CategoryGroup } from "@/lib/db/schema";
import type { PluggyCategoryRuleDirection } from "@/lib/interfaces/pluggy-category-rules";

export type AiProvider = "google" | "openai" | "anthropic" | "deepseek";

export type AiConfig = { provider: AiProvider; model: string; apiKey: string };

/** Provider-specific call settings, keyed by provider name as the AI SDK expects. */
export type AiProviderOptions = NonNullable<Parameters<typeof generateText>[0]["providerOptions"]>;

/** A category the model may choose, already limited to active income and expense categories. */
export type AiCategoryOption = { id: string; name: string; group: CategoryGroup; description: string | null };

/** A rule the user already confirmed, sent as an example of their own criteria. */
export type AiCategoryExample = { normalizedDescription: string; direction: PluggyCategoryRuleDirection; categoryId: string };

/** One pending description group. Amounts, dates and accounts are never part of it. */
export type AiPendingGroup = {
  normalizedDescription: string;
  direction: PluggyCategoryRuleDirection;
  sampleDescription: string;
  occurrences: number;
};

export type AiCategoryRequest = {
  categories: AiCategoryOption[];
  examples: AiCategoryExample[];
  pending: AiPendingGroup[];
};

/** The model's answer for one pending group, already translated back from the prompt aliases. */
export type AiCategorySuggestion = {
  normalizedDescription: string;
  direction: PluggyCategoryRuleDirection;
  categoryId: string | null;
  reason: string | null;
  confidence: number;
};

export interface CategorySuggester {
  suggest(request: AiCategoryRequest): Promise<AiCategorySuggestion[]>;
}

export type AiPromptDirection = "entrada" | "saida";
export type AiPromptCategoryType = "receita" | "despesa_fixa" | "despesa_variavel";

export type AiPromptPayload = {
  categorias: { id: string; nome: string; tipo: AiPromptCategoryType; descricao?: string }[];
  exemplos: { descricao: string; direcao: AiPromptDirection; categoria: string }[];
  pendentes: { id: string; direcao: AiPromptDirection; descricao: string; original: string; ocorrencias: number }[];
};

/** Short prompt ids mapped back to real records, so the model never has to copy a UUID. */
export type AiPromptAliases = {
  categories: Map<string, string>;
  pending: Map<string, AiPendingGroup>;
};

export type AiPromptBatch = { payload: AiPromptPayload; aliases: AiPromptAliases };

export type AiPromptResult = { id: string; motivo: string; categoria: string | null; confianca: number };

export type AiCategorizationCounts = { aiAttempted: number; aiSuggested: number };
