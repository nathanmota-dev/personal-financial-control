import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

import type { AiLocalConnection, AiProviderDefinition } from "@/lib/interfaces/ai-provider";
import type { AiModelOption } from "@/lib/interfaces/ai-settings";
import { aiModelIdSchema } from "@/lib/server/ai/connection";
import { DomainError } from "@/lib/server/errors";

/** Ollama ignores the key, but the OpenAI client needs one and would otherwise read `OPENAI_API_KEY`. */
const PLACEHOLDER_KEY = "ollama";
const MODELS_TIMEOUT_MS = 5_000;
const MODELS_UNAVAILABLE = "Não foi possível listar os modelos. Confira se o Ollama está rodando nessa URL.";

const tagsSchema = z.object({ models: z.array(z.object({ name: z.string() })).max(1_000) });

/** Only ids the Settings form accepts are offered, so a listed model can always be saved. */
function toOptions(names: string[]): AiModelOption[] {
  return [...new Set(names)]
    .filter((name) => aiModelIdSchema.safeParse(name).success)
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({ id: name, label: name }));
}

/** Reads the models installed on the Ollama server, from its own `/api/tags` endpoint. */
export async function listOllamaModels({ baseUrl }: AiLocalConnection): Promise<AiModelOption[]> {
  let body: unknown;
  try {
    const response = await fetch(`${baseUrl}/api/tags`, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(MODELS_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`status ${response.status}`);
    body = await response.json();
  } catch {
    throw new DomainError("AI_MODELS_UNAVAILABLE", MODELS_UNAVAILABLE, 502);
  }
  const parsed = tagsSchema.safeParse(body);
  if (!parsed.success) throw new DomainError("AI_MODELS_UNAVAILABLE", MODELS_UNAVAILABLE, 502);
  return toOptions(parsed.data.models.map((model) => model.name));
}

/**
 * Talks to Ollama's OpenAI-compatible Chat Completions endpoint, which supports tools and structured output.
 * A local model on a CPU can take minutes, so the limits are far longer than a cloud API's.
 */
export const ollamaProvider: AiProviderDefinition<AiLocalConnection> = {
  createModel: ({ baseUrl }, model) => createOpenAI({ baseURL: `${baseUrl}/v1`, apiKey: PLACEHOLDER_KEY, name: "ollama" }).chat(model),
  timeouts: { categorizeMs: 120_000, chatMs: 300_000, checkMs: 60_000 },
  listModels: listOllamaModels,
};
