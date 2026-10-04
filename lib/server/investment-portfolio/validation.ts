import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
investmentAssetClasses,
investmentHoldings,
investmentInstrumentTypes,
investmentPurposeAllocations,
investmentPurposes,
investmentReductionEvents,
investmentReductionSources,
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { normalizeDate,serializeTimestamps } from "@/lib/server/finance";
import { and,eq,inArray } from "drizzle-orm";
import { z } from "zod";


export type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

export type PortfolioDb = AppDb | AppDbTransaction;

export const nullableTextSchema = z.string().trim().nullable().optional();

export const investmentHoldingSchema = z.object({
  name: z.string().trim().min(1),
  ticker: nullableTextSchema,
  institutionName: nullableTextSchema,
  assetClass: z.enum(investmentAssetClasses),
  instrumentType: z.enum(investmentInstrumentTypes),
  currentValueCents: z.number().int().nonnegative(),
  valueAsOf: z.string().trim().min(1).optional(),
  notes: nullableTextSchema,
});

export const updateInvestmentHoldingSchema = investmentHoldingSchema.partial().extend({
  id: z.string().uuid(),
});

export const investmentPurposeSchema = z.object({
  name: z.string().trim().min(1),
  kind: z.enum(["general", "emergency_reserve"]).default("general"),
  targetAmountCents: z.number().int().nonnegative().nullable().optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#22d3ee"),
  notes: nullableTextSchema,
});

export const updateInvestmentPurposeSchema = investmentPurposeSchema.partial().extend({
  id: z.string().uuid(),
});

export const investmentPurposeAllocationSchema = z.object({
  holdingId: z.string().uuid(),
  purposeId: z.string().uuid(),
  amountCents: z.number().int().nonnegative(),
  allocatedOn: z.string().trim().min(1),
  notes: nullableTextSchema,
});

export const deleteAllocationSchema = z.union([
  z.object({ id: z.string().uuid() }),
  z.object({ holdingId: z.string().uuid(), purposeId: z.string().uuid() }),
]);

export type HoldingRow = typeof investmentHoldings.$inferSelect;

export type PurposeRow = typeof investmentPurposes.$inferSelect;

export type AllocationRow = typeof investmentPurposeAllocations.$inferSelect;

export function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

export function resolveReadDb(database?: PortfolioDb): Promise<PortfolioDb> {
  return Promise.resolve(database ?? getFinanceDatabase());
}

export function normalizeNullableText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

export function normalizePortfolioDate(value: string) {
  const normalized = normalizeDate(value.trim());
  const parsed = new Date(`${normalized}T00:00:00.000Z`);

  invariant(
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === normalized,
    "INVALID_DATE",
    "Date must be a valid calendar date."
  );

  return normalized;
}

export function serializeHolding(row: HoldingRow) {
  return serializeTimestamps(row);
}

export function serializePurpose(row: PurposeRow) {
  return serializeTimestamps(row);
}

export function serializeAllocation(row: AllocationRow) {
  return serializeTimestamps(row);
}

export function sumAllocationAmounts(rows: AllocationRow[]) {
  return rows.reduce((total, row) => total + row.amountCents, 0);
}

export async function assertNoActiveReductionSource(
  transaction: PortfolioDb,
  filter: {
    holdingId?: string;
    purposeId?: string;
    allocationId?: string;
  }
) {
  const sources = await transaction.query.investmentReductionSources.findMany({
    where: and(
      filter.holdingId ? eq(investmentReductionSources.holdingId, filter.holdingId) : undefined,
      filter.purposeId ? eq(investmentReductionSources.purposeId, filter.purposeId) : undefined,
      filter.allocationId
        ? eq(investmentReductionSources.allocationId, filter.allocationId)
        : undefined
    ),
  });

  if (!sources.length) {
    return;
  }

  const activeEvent = await transaction.query.investmentReductionEvents.findFirst({
    where: and(
      eq(investmentReductionEvents.status, "active"),
      inArray(
        investmentReductionEvents.id,
        sources.map((source) => source.eventId)
      )
    ),
  });

  invariant(
    !activeEvent,
    "INVESTMENT_SOURCE_IN_ACTIVE_REDUCTION",
    "This investment source is part of an active reduction and cannot be archived or deleted yet."
  );
}

export function buildPercentage(amountCents: number, denominatorCents: number) {
  return denominatorCents > 0 ? (amountCents / denominatorCents) * 100 : 0;
}

export function sortAllocations(left: AllocationRow, right: AllocationRow) {
  return (
    right.allocatedOn.localeCompare(left.allocatedOn) ||
    right.updatedAt.getTime() - left.updatedAt.getTime()
  );
}

export function maxIsoDate(values: string[]) {
  return values.reduce<string | null>(
    (latest, value) => (!latest || value > latest ? value : latest),
    null
  );
}
