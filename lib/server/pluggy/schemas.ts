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

const pluggyPartySchema = z.looseObject({
  documentNumber: z.union([z.string(), z.looseObject({ value: optionalText })]).nullish(),
  name: optionalText,
});

const pluggyPaymentDataSchema = z.looseObject({ payer: pluggyPartySchema.nullish(), receiver: pluggyPartySchema.nullish() });

const pluggyCardMetadataSchema = z.looseObject({
  installmentNumber: z.number().int().nullish(),
  totalInstallments: z.number().int().nullish(),
  purchaseDate: optionalText,
  billId: optionalText,
});

// Later import steps read more fields, so unknown ones are kept on these records.
export const pluggyTransactionSchema = z.looseObject({
  id: z.string().min(1),
  date: z.string().min(1),
  amount: z.number(),
  amountInAccountCurrency: z.number().nullish(),
  currencyCode: optionalText,
  type: optionalText,
  status: optionalText,
  description: optionalText,
  providerId: optionalText,
  operationType: optionalText,
  // A malformed counterparty must not reject the whole page of transactions.
  paymentData: pluggyPaymentDataSchema.nullish().catch(null),
  creditCardMetadata: pluggyCardMetadataSchema.nullish().catch(null),
});

const pluggyBillPaymentSchema = z.looseObject({ amount: z.number().nullish(), paymentDate: optionalText });

export const pluggyBillSchema = z.looseObject({
  id: z.string().min(1),
  dueDate: z.string().min(1),
  billClosingDate: optionalText,
  totalAmount: z.number().nullish(),
  // A malformed payment list must not reject the bill it belongs to.
  payments: z.array(pluggyBillPaymentSchema).nullish().catch(null),
});

export const pluggyInvestmentSchema = z.looseObject({ id: z.string().min(1) });

export function pluggyPageSchema<T extends z.ZodType>(item: T) {
  return z.object({ results: z.array(item), totalPages: z.number().int().nullish() });
}

export function pluggyCursorSchema<T extends z.ZodType>(item: T) {
  return z.object({ results: z.array(item), next: z.string().nullish() });
}
