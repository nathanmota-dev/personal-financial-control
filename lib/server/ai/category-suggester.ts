import { generateText, Output } from "ai";

import type {
  AiCategoryOption,
  AiCategoryRequest,
  AiCategorySuggestion,
  AiConfig,
  AiPromptBatch,
  AiPromptResult,
  CategorySuggester,
} from "@/lib/interfaces/ai-categorization";
import { categoryFitsDirection } from "@/lib/server/pluggy/category-rules";
import { buildCategoryBatches, buildCategoryResponseSchema, buildCategorySystemPrompt } from "./category-prompt";
import { createLanguageModel, languageModelOptions } from "./model";

/** Below this the answer counts as "unknown": a wrong category costs more than a manual one. */
export const AI_SUGGESTION_MIN_CONFIDENCE = 0.8;
const MAX_REASON_LENGTH = 120;
const CALL_TIMEOUT_MS = 30_000;

export type AiBatchGenerator = (batch: AiPromptBatch) => Promise<AiPromptResult[]>;

function modelGenerator(config: AiConfig): AiBatchGenerator {
  const model = createLanguageModel(config);
  const providerOptions = languageModelOptions(config);
  return async (batch) => {
    const schema = buildCategoryResponseSchema([...batch.aliases.categories.keys()]);
    const { output } = await generateText({
      model,
      instructions: buildCategorySystemPrompt(),
      prompt: JSON.stringify(batch.payload),
      output: Output.object({ schema, name: "categorizacao" }),
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      ...(providerOptions ? { providerOptions } : {}),
    });
    return output.resultados;
  };
}

function clampConfidence(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/** The prompt asks for valid answers; this decides which ones are kept. Unknown and repeated ids are dropped. */
export function validateBatchResults(batch: AiPromptBatch, results: AiPromptResult[], categories: AiCategoryOption[]): AiCategorySuggestion[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const seen = new Set<string>();
  const suggestions: AiCategorySuggestion[] = [];
  for (const result of results) {
    const group = batch.aliases.pending.get(result.id);
    if (!group || seen.has(result.id)) continue;
    seen.add(result.id);
    const confidence = clampConfidence(result.confianca);
    const categoryId = result.categoria ? batch.aliases.categories.get(result.categoria) : undefined;
    const category = categoryId ? byId.get(categoryId) : undefined;
    const accepted = category && confidence >= AI_SUGGESTION_MIN_CONFIDENCE
      && categoryFitsDirection({ ...category, isArchived: false }, group.direction);
    const reason = result.motivo.trim().slice(0, MAX_REASON_LENGTH) || null;
    suggestions.push({
      normalizedDescription: group.normalizedDescription,
      direction: group.direction,
      categoryId: accepted ? category.id : null,
      reason: accepted ? reason : null,
      confidence: accepted ? confidence : 0,
    });
  }
  return suggestions;
}

/** Batches run one after another, so a provider's rate limit is not hit by parallel calls. */
export function createAiCategorySuggester(config: AiConfig, generate: AiBatchGenerator = modelGenerator(config)): CategorySuggester {
  return {
    async suggest(request: AiCategoryRequest) {
      const suggestions: AiCategorySuggestion[] = [];
      for (const batch of buildCategoryBatches(request)) {
        suggestions.push(...validateBatchResults(batch, await generate(batch), request.categories));
      }
      return suggestions;
    },
  };
}
