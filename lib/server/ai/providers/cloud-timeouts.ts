import type { AiProviderTimeouts } from "@/lib/interfaces/ai-provider";

/** A cloud API answers a categorization batch in seconds; the chat may run several tool steps. */
export const CLOUD_TIMEOUTS: AiProviderTimeouts = { categorizeMs: 30_000, chatMs: 90_000, checkMs: 20_000 };
