import { generateText, type LanguageModel } from "ai";

import type { AppDb } from "@/lib/db";
import type { AiModelOption } from "@/lib/interfaces/ai-settings";
import { createLanguageModel, languageModelOptions, languageModelTimeouts } from "@/lib/server/ai/model";
import { getAiProvider } from "@/lib/server/ai/providers/registry";
import { resolveAiConfig, resolveAiConnection } from "@/lib/server/ai/settings";
import { DomainError } from "@/lib/server/errors";
import type { AiModelsInput, AiSettingsInput } from "./inputs";

/** The provider's message can carry request details, so the form shows a fixed text instead. */
export const AI_CHECK_ERROR = "O provedor não respondeu. Confira a conexão e o modelo.";

/** Enough room for a short answer even when the model spends a few tokens thinking first. */
const CHECK_MAX_OUTPUT_TOKENS = 64;

export type AiCheckDependencies = { model?: LanguageModel };

/** Sends one tiny prompt with the form's configuration, so a wrong key, address or model shows up before saving. */
export async function checkAiSettings(input: AiSettingsInput, db: AppDb, dependencies: AiCheckDependencies = {}): Promise<void> {
  const config = await resolveAiConfig(input, db);
  const providerOptions = languageModelOptions(config);
  try {
    await generateText({
      model: dependencies.model ?? createLanguageModel(config),
      prompt: "Responda apenas: ok",
      maxOutputTokens: CHECK_MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(languageModelTimeouts(config).checkMs),
      ...(providerOptions ? { providerOptions } : {}),
    });
  } catch {
    throw new DomainError("AI_CHECK_FAILED", AI_CHECK_ERROR, 502);
  }
}

/** Only a provider that can report its own models (a local server) is asked; the others keep the fixed catalog. */
export async function listAiModels(input: AiModelsInput, db: AppDb): Promise<AiModelOption[]> {
  const { listModels } = getAiProvider(input.provider);
  if (!listModels) throw new DomainError("AI_MODELS_UNSUPPORTED", "Esse provedor não lista modelos.");
  return listModels(await resolveAiConnection(input, db));
}
