import {
  convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream,
  validateUIMessages, type LanguageModel, type UIMessage,
} from "ai";

import { buildChatTools } from "@/lib/chat/tools";
import type { AppDb } from "@/lib/db";
import type { AiConfig } from "@/lib/interfaces/ai-categorization";
import { buildChatSystemPrompt } from "@/lib/server/ai/chat-prompt";
import { CHAT_MAX_BODY_BYTES, CHAT_MAX_STEPS, CHAT_TIMEOUT_MS, chatRequestSchema } from "@/lib/server/ai/chat-inputs";
import { createLanguageModel, languageModelOptions } from "@/lib/server/ai/model";
import { DomainError } from "@/lib/server/errors";
import { getFinanceToday } from "@/lib/server/runtime";

/** The provider's message can carry request details, so the chat shows a fixed text instead. */
export const CHAT_STREAM_ERROR = "Não foi possível obter a resposta do provedor de IA. Confira a chave e o modelo em Configurações.";

export type ChatDependencies = { model?: LanguageModel };

async function readMessages(request: Request) {
  const text = await request.text();
  if (text.length > CHAT_MAX_BODY_BYTES) throw new DomainError("CHAT_TOO_LARGE", "A conversa ficou grande demais. Comece uma nova.", 413);
  return chatRequestSchema.parse(JSON.parse(text)).messages;
}

/** Streams one assistant turn, answering only with the read-only tools. The key never leaves the server. */
export async function streamChatResponse(request: Request, config: AiConfig | null, db: AppDb, dependencies: ChatDependencies = {}) {
  if (!config) throw new DomainError("AI_NOT_CONFIGURED", "Configure uma API key em Configurações → IA para usar o chat.", 409);
  const tools = buildChatTools(db);
  const messages = await validateUIMessages<UIMessage>({ messages: await readMessages(request) });
  const today = getFinanceToday();
  const providerOptions = languageModelOptions(config);
  const result = streamText({
    model: dependencies.model ?? createLanguageModel(config),
    instructions: buildChatSystemPrompt({ today, month: today.slice(0, 7) }),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(CHAT_MAX_STEPS),
    maxRetries: 1,
    abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(CHAT_TIMEOUT_MS)]),
    ...(providerOptions ? { providerOptions } : {}),
  });
  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream, tools, onError: () => CHAT_STREAM_ERROR }) });
}
