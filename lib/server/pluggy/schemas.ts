import { z } from "zod";

const optionalText = z.string().nullish();

export const pluggyAuthSchema = z.object({ apiKey: z.string().min(1) });

export const pluggyItemSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  connector: z.object({ name: optionalText }).nullish(),
  lastUpdatedAt: optionalText,
  nextAutoSyncAt: optionalText,
});

export const pluggyAccountSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  marketingName: optionalText,
  number: optionalText,
});

// Later import steps read more fields, so unknown ones are kept on these records.
export const pluggyTransactionSchema = z.looseObject({
  id: z.string().min(1),
  date: z.string().min(1),
  amount: z.number(),
});

export const pluggyBillSchema = z.looseObject({
  id: z.string().min(1),
  dueDate: z.string().min(1),
});

export const pluggyInvestmentSchema = z.looseObject({ id: z.string().min(1) });

export function pluggyPageSchema<T extends z.ZodType>(item: T) {
  return z.object({ results: z.array(item), totalPages: z.number().int().nullish() });
}

export function pluggyCursorSchema<T extends z.ZodType>(item: T) {
  return z.object({ results: z.array(item), next: z.string().nullish() });
}
