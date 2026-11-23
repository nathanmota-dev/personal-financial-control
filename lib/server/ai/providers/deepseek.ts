import { createDeepSeek } from "@ai-sdk/deepseek";

import type { AiApiKeyConnection, AiProviderDefinition } from "@/lib/interfaces/ai-provider";
import { CLOUD_TIMEOUTS } from "./cloud-timeouts";

export const deepseekProvider: AiProviderDefinition<AiApiKeyConnection> = {
  createModel: ({ apiKey }, model) => createDeepSeek({ apiKey })(model),
  timeouts: CLOUD_TIMEOUTS,
};
