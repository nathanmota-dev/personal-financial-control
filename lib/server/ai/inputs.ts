import { z } from "zod";

import { aiProviders } from "@/lib/ai-model-catalog";
import type { AiProvider } from "@/lib/interfaces/ai-categorization";
import { aiConnectionSchema, aiModelIdSchema } from "@/lib/server/ai/connection";

const providerSchema = z.enum(aiProviders as [AiProvider, ...AiProvider[]]);

/** `connection` is optional: leaving it out keeps the stored one for the same provider. */
export const aiModelsInputSchema = z.object({
  provider: providerSchema,
  connection: aiConnectionSchema.optional(),
});

export const aiSettingsInputSchema = aiModelsInputSchema.extend({ model: aiModelIdSchema });

export type AiConnectionInput = z.infer<typeof aiConnectionSchema>;

export type AiModelsInput = z.infer<typeof aiModelsInputSchema>;

export type AiSettingsInput = z.infer<typeof aiSettingsInputSchema>;
