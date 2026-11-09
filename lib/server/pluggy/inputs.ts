import { z } from "zod";

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

export const pluggySyncRequestSchema = z.object({ dryRun: z.boolean().default(false) });
export const pluggyItemIdSchema = recordId;

export type PluggyItemInput = z.infer<typeof pluggyItemInputSchema>;
export type PluggyLinkInput = z.infer<typeof pluggyLinkInputSchema>;
export type PluggyLinkUpdate = z.infer<typeof pluggyLinkUpdateSchema>;
