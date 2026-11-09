import { z } from "zod";

import { pluggyCategoryRuleDirections } from "@/lib/db/schema";

const recordId = z.string().trim().min(1).max(100);

export const pluggyItemInputSchema = z.object({
  externalItemId: z.string().trim().regex(/^[A-Za-z0-9-]{1,100}$/),
  label: z.string().trim().min(1).max(60),
});

export const pluggyLinkInputSchema = z.object({
  itemId: recordId,
  externalAccountId: z.string().trim().min(1).max(100),
  accountId: recordId,
  cutoffDate: z.iso.date(),
});

export const pluggyLinkUpdateSchema = z.object({
  id: recordId,
  accountId: recordId.optional(),
  cutoffDate: z.iso.date().optional(),
  isEnabled: z.boolean().optional(),
});

export const pluggyIdentityInputSchema = z.object({
  names: z.array(z.string().trim().max(120).regex(/^\S+\s+\S/)).max(5),
  cpf: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().regex(/^\d{11}$/)).optional(),
  otherOwnAccountId: recordId.nullable(),
});

export const pluggyCategoryRuleInputSchema = z.object({
  normalizedDescription: z.string().trim().min(1).max(500),
  direction: z.enum(pluggyCategoryRuleDirections),
  categoryId: recordId,
});

export const pluggySyncRequestSchema = z.object({ dryRun: z.boolean().default(false) });
export const pluggyItemIdSchema = recordId;

export type PluggyItemInput = z.infer<typeof pluggyItemInputSchema>;
export type PluggyLinkInput = z.infer<typeof pluggyLinkInputSchema>;
export type PluggyLinkUpdate = z.infer<typeof pluggyLinkUpdateSchema>;
export type PluggyIdentityInput = z.infer<typeof pluggyIdentityInputSchema>;
export type PluggyCategoryRuleInput = z.infer<typeof pluggyCategoryRuleInputSchema>;
