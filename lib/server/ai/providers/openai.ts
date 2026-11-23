import { createOpenAI } from "@ai-sdk/openai";

import type { AiApiKeyConnection, AiProviderDefinition } from "@/lib/interfaces/ai-provider";
import { CLOUD_TIMEOUTS } from "./cloud-timeouts";

export const openaiProvider: AiProviderDefinition<AiApiKeyConnection> = {
  createModel: ({ apiKey }, model) => createOpenAI({ apiKey })(model),
  timeouts: CLOUD_TIMEOUTS,
};
