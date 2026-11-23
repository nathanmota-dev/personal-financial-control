import { describe, expect, it, vi } from "vitest";

import type { AiCategoryRequest, AiConfig, AiPromptResult } from "@/lib/interfaces/ai-categorization";
import { buildCategoryBatches } from "@/lib/server/ai/category-prompt";
import { AI_SUGGESTION_MIN_CONFIDENCE, createAiCategorySuggester, validateBatchResults } from "@/lib/server/ai/category-suggester";

const config: AiConfig = { provider: "google", model: "test-model", connection: { kind: "apiKey", apiKey: "test-key" } };

const request: AiCategoryRequest = {
  categories: [
    { id: "uuid-health", name: "Saúde", group: "variable_expense", description: null },
    { id: "uuid-salary", name: "Salário", group: "income", description: null },
  ],
  examples: [],
  pending: [
    { normalizedDescription: "DROGA RAIA", direction: "expense", sampleDescription: "DROGA RAIA", occurrences: 1 },
    { normalizedDescription: "EMPRESA X", direction: "income", sampleDescription: "EMPRESA X", occurrences: 1 },
  ],
};

const [batch] = buildCategoryBatches(request);
const answer = (overrides: Partial<AiPromptResult> = {}): AiPromptResult => ({ id: "p1", motivo: "Rede de farmácias", categoria: "c1", confianca: 0.95, ...overrides });
const validate = (results: AiPromptResult[]) => validateBatchResults(batch, results, request.categories);

describe("validating the model's answer", () => {
  it("translates aliases back to real ids", () => {
    expect(validate([answer()])).toEqual([{ normalizedDescription: "DROGA RAIA", direction: "expense", categoryId: "uuid-health", reason: "Rede de farmácias", confidence: 0.95 }]);
  });

  it("drops unknown and repeated pending ids", () => {
    expect(validate([answer({ id: "p9" }), answer(), answer({ categoria: null })])).toHaveLength(1);
  });

  it("records low confidence as unknown", () => {
    expect(validate([answer({ confianca: AI_SUGGESTION_MIN_CONFIDENCE - 0.01 })])[0]).toMatchObject({ categoryId: null, reason: null, confidence: 0 });
  });

  it("records a category of the wrong direction as unknown", () => {
    expect(validate([answer({ id: "p2", categoria: "c1" })])[0]).toMatchObject({ normalizedDescription: "EMPRESA X", categoryId: null });
  });

  it("records an alias outside the list as unknown", () => {
    expect(validate([answer({ categoria: "c7" })])[0]).toMatchObject({ categoryId: null });
  });

  it("clamps confidence and truncates long reasons", () => {
    const [result] = validate([answer({ confianca: 7, motivo: "x".repeat(500) })]);
    expect(result.confidence).toBe(1);
    expect(result.reason).toHaveLength(120);
  });
});

describe("AI category suggester", () => {
  it("sends one call per batch and returns validated suggestions", async () => {
    const generate = vi.fn(async () => [answer(), answer({ id: "p2", categoria: "c2", motivo: "Salário" })]);
    const suggestions = await createAiCategorySuggester(config, generate).suggest(request);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(suggestions.map((suggestion) => suggestion.categoryId)).toEqual(["uuid-health", "uuid-salary"]);
  });

  it("makes no call when there is nothing to ask", async () => {
    const generate = vi.fn(async () => []);
    await expect(createAiCategorySuggester(config, generate).suggest({ ...request, pending: [] })).resolves.toEqual([]);
    expect(generate).not.toHaveBeenCalled();
  });
});

describe("provider options", () => {
  it("keeps Gemini thinking low and leaves other providers on their defaults", async () => {
    const { languageModelOptions } = await import("@/lib/server/ai/model");
    expect(languageModelOptions(config)).toEqual({ google: { thinkingConfig: { thinkingLevel: "low" } } });
    expect(languageModelOptions({ ...config, provider: "openai" })).toBeUndefined();
  });
});
