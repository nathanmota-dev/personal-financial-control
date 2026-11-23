import { createAnthropic } from "@ai-sdk/anthropic";

import type { AiApiKeyConnection, AiProviderDefinition } from "@/lib/interfaces/ai-provider";
import { CLOUD_TIMEOUTS } from "./cloud-timeouts";

export const anthropicProvider: AiProviderDefinition<AiApiKeyConnection> = {
  createModel: ({ apiKey }, model) => createAnthropic({ apiKey })(model),
  timeouts: CLOUD_TIMEOUTS,
};
