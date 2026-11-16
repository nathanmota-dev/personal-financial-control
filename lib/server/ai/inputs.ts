import { z } from "zod";

import { aiProviders } from "@/lib/ai-model-catalog";
import type { AiProvider } from "@/lib/interfaces/ai-categorization";

export const aiSettingsInputSchema = z.object({
  provider: z.enum(aiProviders as [AiProvider, ...AiProvider[]]),
  model: z.string().trim().min(1).max(120).regex(/^[\w.:/-]+$/),
  apiKey: z.string().trim().min(8).max(512).regex(/^\S+$/).optional(),
});

export type AiSettingsInput = z.infer<typeof aiSettingsInputSchema>;
