import { createGoogle } from "@ai-sdk/google";

import type { AiApiKeyConnection, AiProviderDefinition } from "@/lib/interfaces/ai-provider";
import { CLOUD_TIMEOUTS } from "./cloud-timeouts";

/**
 * Matching a description to a category needs little reasoning. On Gemini the default thinking spent about
 * three quarters of the output tokens and tripled the latency with the same answers, so it is kept low.
 */
export const googleProvider: AiProviderDefinition<AiApiKeyConnection> = {
  createModel: ({ apiKey }, model) => createGoogle({ apiKey })(model),
  options: { google: { thinkingConfig: { thinkingLevel: "low" } } },
  timeouts: CLOUD_TIMEOUTS,
};
