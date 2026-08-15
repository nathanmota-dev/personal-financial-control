import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  investmentAssetClasses,
  investmentHoldings,
  investmentInstrumentTypes,
  investmentPurposeAllocations,
  investmentPurposes,
} from "@/lib/db/schema";
import {
  investmentAssetClassLabels,
  investmentInstrumentTypeLabels,
} from "@/lib/finance-ui";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { getInvestmentProjection } from "@/lib/server/investments";
import { getFinanceToday } from "@/lib/server/runtime";

type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type PortfolioDb = AppDb | AppDbTransaction;

const nullableTextSchema = z.string().trim().nullable().optional();

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

const deleteAllocationSchema = z.union([
  z.object({ id: z.string().uuid() }),
  z.object({ holdingId: z.string().uuid(), purposeId: z.string().uuid() }),
]);

type HoldingRow = typeof investmentHoldings.$inferSelect;
type PurposeRow = typeof investmentPurposes.$inferSelect;
type AllocationRow = typeof investmentPurposeAllocations.$inferSelect;

function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

function resolveReadDb(database?: PortfolioDb): Promise<PortfolioDb> {
  return Promise.resolve(database ?? getFinanceDatabase());
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

function normalizePortfolioDate(value: string) {
  const normalized = normalizeDate(value.trim());
  const parsed = new Date(`${normalized}T00:00:00.000Z`);

  invariant(
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === normalized,
    "INVALID_DATE",
    "Date must be a valid calendar date."
  );

  return normalized;
}

function serializeHolding(row: HoldingRow) {
  return serializeTimestamps(row);
}

function serializePurpose(row: PurposeRow) {
  return serializeTimestamps(row);
}

function serializeAllocation(row: AllocationRow) {
  return serializeTimestamps(row);
}

function sumAllocationAmounts(rows: AllocationRow[]) {
  return rows.reduce((total, row) => total + row.amountCents, 0);
}

function buildPercentage(amountCents: number, denominatorCents: number) {
  return denominatorCents > 0 ? (amountCents / denominatorCents) * 100 : 0;
}

function sortAllocations(left: AllocationRow, right: AllocationRow) {
  return (
    right.allocatedOn.localeCompare(left.allocatedOn) ||
    right.updatedAt.getTime() - left.updatedAt.getTime()
  );
}

function maxIsoDate(values: string[]) {
  return values.reduce<string | null>(
    (latest, value) => (!latest || value > latest ? value : latest),
    null
  );
}

export async function createInvestmentHolding(
  input: z.input<typeof investmentHoldingSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentHoldingSchema.parse(input);
  const [created] = await db
    .insert(investmentHoldings)
    .values({
      name: values.name,
      ticker: normalizeNullableText(values.ticker),
      institutionName: normalizeNullableText(values.institutionName),
      assetClass: values.assetClass,
      instrumentType: values.instrumentType,
      currentValueCents: values.currentValueCents,
      valueAsOf: normalizePortfolioDate(values.valueAsOf ?? getFinanceToday()),
      notes: normalizeNullableText(values.notes),
    })
    .returning();

  invariant(created, "HOLDING_CREATE_FAILED", "Investment holding could not be created.", 500);

  return serializeHolding(created);
}

export async function updateInvestmentHolding(
  input: z.input<typeof updateInvestmentHoldingSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = updateInvestmentHoldingSchema.parse(input);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentHoldings.findFirst({
      where: eq(investmentHoldings.id, values.id),
    });

    invariant(existing, "INVESTMENT_HOLDING_NOT_FOUND", "Investment holding does not exist.", 404);

    const allocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, existing.id),
    });
    const allocatedCents = sumAllocationAmounts(allocations);
    const currentValueCents = values.currentValueCents ?? existing.currentValueCents;

    invariant(
      currentValueCents >= allocatedCents,
      "HOLDING_VALUE_BELOW_ALLOCATIONS",
      "The current value cannot be lower than the holding allocations."
    );

    const [updated] = await transaction
      .update(investmentHoldings)
      .set({
        name: values.name ?? existing.name,
        ticker:
          values.ticker === undefined
            ? existing.ticker
            : normalizeNullableText(values.ticker),
        institutionName:
          values.institutionName === undefined
            ? existing.institutionName
            : normalizeNullableText(values.institutionName),
        assetClass: values.assetClass ?? existing.assetClass,
        instrumentType: values.instrumentType ?? existing.instrumentType,
        currentValueCents,
        valueAsOf:
          values.valueAsOf === undefined
            ? existing.valueAsOf
            : normalizePortfolioDate(values.valueAsOf),
        notes:
          values.notes === undefined ? existing.notes : normalizeNullableText(values.notes),
        updatedAt: currentTimestamp(),
      })
      .where(eq(investmentHoldings.id, existing.id))
      .returning();

    invariant(updated, "HOLDING_UPDATE_FAILED", "Investment holding could not be updated.", 500);

    return serializeHolding(updated);
  });
}

export async function archiveInvestmentHolding(id: string, database?: AppDb) {
  const db = await resolveDb(database);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentHoldings.findFirst({
      where: eq(investmentHoldings.id, id),
    });

    invariant(existing, "INVESTMENT_HOLDING_NOT_FOUND", "Investment holding does not exist.", 404);
    invariant(
      existing.currentValueCents === 0,
      "HOLDING_ARCHIVE_REQUIRES_ZERO_VALUE",
      "An investment holding can only be archived when its current value is zero."
    );

    const allocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, id),
    });
    invariant(
      allocations.length === 0,
      "HOLDING_ARCHIVE_REQUIRES_NO_ALLOCATIONS",
      "Remove all holding allocations before archiving it."
    );

    const [archived] = await transaction
      .update(investmentHoldings)
      .set({ isArchived: true, updatedAt: currentTimestamp() })
      .where(eq(investmentHoldings.id, id))
      .returning();

    invariant(archived, "HOLDING_ARCHIVE_FAILED", "Investment holding could not be archived.", 500);

    return serializeHolding(archived);
  });
}

export async function createInvestmentPurpose(
  input: z.input<typeof investmentPurposeSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentPurposeSchema.parse(input);
  const [created] = await db
    .insert(investmentPurposes)
    .values({
      name: values.name,
      targetAmountCents: values.targetAmountCents ?? null,
      color: values.color,
      notes: normalizeNullableText(values.notes),
    })
    .returning();

  invariant(created, "PURPOSE_CREATE_FAILED", "Investment purpose could not be created.", 500);

  return serializePurpose(created);
}

export async function updateInvestmentPurpose(
  input: z.input<typeof updateInvestmentPurposeSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = updateInvestmentPurposeSchema.parse(input);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPurposes.findFirst({
      where: eq(investmentPurposes.id, values.id),
    });

    invariant(existing, "INVESTMENT_PURPOSE_NOT_FOUND", "Investment purpose does not exist.", 404);

    const [updated] = await transaction
      .update(investmentPurposes)
      .set({
        name: values.name ?? existing.name,
        targetAmountCents:
          values.targetAmountCents === undefined
            ? existing.targetAmountCents
            : values.targetAmountCents,
        color: values.color ?? existing.color,
        notes:
          values.notes === undefined ? existing.notes : normalizeNullableText(values.notes),
        updatedAt: currentTimestamp(),
      })
      .where(eq(investmentPurposes.id, values.id))
      .returning();

    invariant(updated, "PURPOSE_UPDATE_FAILED", "Investment purpose could not be updated.", 500);

    return serializePurpose(updated);
  });
}

export async function archiveInvestmentPurpose(id: string, database?: AppDb) {
  const db = await resolveDb(database);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPurposes.findFirst({
      where: eq(investmentPurposes.id, id),
    });

    invariant(existing, "INVESTMENT_PURPOSE_NOT_FOUND", "Investment purpose does not exist.", 404);

    const allocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.purposeId, id),
    });
    invariant(
      sumAllocationAmounts(allocations) === 0,
      "PURPOSE_ARCHIVE_REQUIRES_ZERO_BALANCE",
      "A purpose can only be archived when it has no allocated balance."
    );

    const [archived] = await transaction
      .update(investmentPurposes)
      .set({ isArchived: true, updatedAt: currentTimestamp() })
      .where(eq(investmentPurposes.id, id))
      .returning();

    invariant(archived, "PURPOSE_ARCHIVE_FAILED", "Investment purpose could not be archived.", 500);

    return serializePurpose(archived);
  });
}

export async function upsertInvestmentPurposeAllocation(
  input: z.input<typeof investmentPurposeAllocationSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentPurposeAllocationSchema.parse(input);

  return db.transaction(async (transaction) => {
    const [holding, purpose, existing] = await Promise.all([
      transaction.query.investmentHoldings.findFirst({
        where: eq(investmentHoldings.id, values.holdingId),
      }),
      transaction.query.investmentPurposes.findFirst({
        where: eq(investmentPurposes.id, values.purposeId),
      }),
      transaction.query.investmentPurposeAllocations.findFirst({
        where: and(
          eq(investmentPurposeAllocations.holdingId, values.holdingId),
          eq(investmentPurposeAllocations.purposeId, values.purposeId)
        ),
      }),
    ]);

    invariant(holding, "INVESTMENT_HOLDING_NOT_FOUND", "Investment holding does not exist.", 404);
    invariant(purpose, "INVESTMENT_PURPOSE_NOT_FOUND", "Investment purpose does not exist.", 404);
    invariant(!holding.isArchived, "ARCHIVED_HOLDING_ALLOCATION", "Archived holdings cannot be allocated.");
    invariant(!purpose.isArchived, "ARCHIVED_PURPOSE_ALLOCATION", "Archived purposes cannot receive allocations.");

    const holdingAllocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, holding.id),
    });
    const allocatedElsewhereCents = holdingAllocations
      .filter((allocation) => allocation.id !== existing?.id)
      .reduce((total, allocation) => total + allocation.amountCents, 0);

    invariant(
      allocatedElsewhereCents + values.amountCents <= holding.currentValueCents,
      "ALLOCATION_EXCEEDS_HOLDING_VALUE",
      "The allocation cannot exceed the current value of the holding."
    );

    const allocationValues = {
      amountCents: values.amountCents,
      allocatedOn: normalizePortfolioDate(values.allocatedOn),
      notes: normalizeNullableText(values.notes),
      updatedAt: currentTimestamp(),
    };

    if (existing) {
      const [updated] = await transaction
        .update(investmentPurposeAllocations)
        .set(allocationValues)
        .where(eq(investmentPurposeAllocations.id, existing.id))
        .returning();

      invariant(
        updated,
        "ALLOCATION_UPDATE_FAILED",
        "Investment purpose allocation could not be updated.",
        500
      );

      return serializeAllocation(updated);
    }

    const [created] = await transaction
      .insert(investmentPurposeAllocations)
      .values({
        holdingId: values.holdingId,
        purposeId: values.purposeId,
        ...allocationValues,
      })
      .returning();

    invariant(
      created,
      "ALLOCATION_CREATE_FAILED",
      "Investment purpose allocation could not be created.",
      500
    );

    return serializeAllocation(created);
  });
}

export async function deleteInvestmentPurposeAllocation(
  input: string | z.input<typeof deleteAllocationSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = typeof input === "string" ? { id: input } : deleteAllocationSchema.parse(input);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPurposeAllocations.findFirst({
      where:
        "id" in values
          ? eq(investmentPurposeAllocations.id, values.id)
          : and(
              eq(investmentPurposeAllocations.holdingId, values.holdingId),
              eq(investmentPurposeAllocations.purposeId, values.purposeId)
            ),
    });

    invariant(existing, "INVESTMENT_ALLOCATION_NOT_FOUND", "Investment purpose allocation does not exist.", 404);

    const [deleted] = await transaction
      .delete(investmentPurposeAllocations)
      .where(eq(investmentPurposeAllocations.id, existing.id))
      .returning();

    invariant(
      deleted,
      "ALLOCATION_DELETE_FAILED",
      "Investment purpose allocation could not be deleted.",
      500
    );

    return serializeAllocation(deleted);
  });
}

export async function getInvestmentPortfolioDashboard(database?: PortfolioDb) {
  const db = await resolveReadDb(database);
  const [investmentProjection, holdingRows, purposeRows, allocationRows] = await Promise.all([
    getInvestmentProjection(db),
    db.query.investmentHoldings.findMany({
      where: eq(investmentHoldings.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposes.findMany({
      where: eq(investmentPurposes.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposeAllocations.findMany({
      orderBy: (table, { desc: orderDesc }) => [orderDesc(table.allocatedOn), orderDesc(table.createdAt)],
    }),
  ]);

  const totalRegisteredCents = holdingRows.reduce(
    (total, holding) => total + holding.currentValueCents,
    0
  );
  const totalAllocatedCents = sumAllocationAmounts(allocationRows);
  const globalBalanceCents = investmentProjection?.currentBalanceCents ?? null;
  const comparisonBalanceCents = globalBalanceCents ?? totalRegisteredCents;
  const unclassifiedCents = Math.max(comparisonBalanceCents - totalAllocatedCents, 0);
  const overAllocatedCents = globalBalanceCents !== null
    ? Math.max(totalAllocatedCents - globalBalanceCents, 0)
    : 0;
  const notRegisteredCents = globalBalanceCents !== null
    ? Math.max(globalBalanceCents - totalRegisteredCents, 0)
    : 0;
  const registrationDifferenceCents = globalBalanceCents === null
    ? null
    : totalRegisteredCents - globalBalanceCents;

  const allocationsByHolding = groupAllocations(allocationRows, "holdingId");
  const allocationsByPurpose = groupAllocations(allocationRows, "purposeId");
  const holdingsById = new Map(holdingRows.map((holding) => [holding.id, holding]));
  const purposesById = new Map(purposeRows.map((purpose) => [purpose.id, purpose]));

  const serializedAllocations = allocationRows.map((allocation) => ({
    ...serializeAllocation(allocation),
    holdingName: holdingsById.get(allocation.holdingId)?.name ?? "Ativo arquivado",
    purposeName: purposesById.get(allocation.purposeId)?.name ?? "Caixinha arquivada",
    purposeColor: purposesById.get(allocation.purposeId)?.color ?? "#64748b",
  }));

  const holdings = holdingRows.map((holding) => {
    const allocations = (allocationsByHolding.get(holding.id) ?? []).sort(sortAllocations);
    const allocatedCents = sumAllocationAmounts(allocations);

    return {
      ...serializeHolding(holding),
      allocatedCents,
      freeValueCents: holding.currentValueCents - allocatedCents,
      allocationCount: allocations.length,
      allocations: allocations.map((allocation) => ({
        ...serializeAllocation(allocation),
        purposeName: purposesById.get(allocation.purposeId)?.name ?? "Caixinha arquivada",
        purposeColor: purposesById.get(allocation.purposeId)?.color ?? "#64748b",
      })),
    };
  });

  const purposes = purposeRows.map((purpose) => {
    const allocations = (allocationsByPurpose.get(purpose.id) ?? []).sort(sortAllocations);
    const allocatedCents = sumAllocationAmounts(allocations);
    const relatedHoldingIds = new Set(allocations.map((allocation) => allocation.holdingId));

    return {
      ...serializePurpose(purpose),
      allocatedCents,
      percentage: buildPercentage(allocatedCents, comparisonBalanceCents),
      holdingCount: relatedHoldingIds.size,
      lastAllocatedOn: allocations[0]?.allocatedOn ?? null,
      progressPercentage:
        purpose.targetAmountCents && purpose.targetAmountCents > 0
          ? Math.min((allocatedCents / purpose.targetAmountCents) * 100, 100)
          : null,
      allocations: allocations.map((allocation) => ({
        ...serializeAllocation(allocation),
        holdingName: holdingsById.get(allocation.holdingId)?.name ?? "Ativo arquivado",
      })),
    };
  });

  const distribution = buildDistribution(holdingRows, globalBalanceCents, notRegisteredCents);
  const lastValueAsOf = maxIsoDate(holdingRows.map((holding) => holding.valueAsOf));
  const lastUpdatedAt = maxIsoDate(
    [...holdingRows, ...purposeRows].map((row) => row.updatedAt.toISOString())
  );

  return {
    investmentProjection,
    globalBalanceCents,
    comparisonBalanceCents,
    totalRegisteredCents,
    totalHoldingsCents: totalRegisteredCents,
    totalAllocatedCents,
    unclassifiedCents,
    overAllocatedCents,
    notRegisteredCents,
    registrationDifferenceCents,
    lastValueAsOf,
    lastUpdatedAt,
    summary: {
      globalBalanceCents,
      investmentBalanceCents: globalBalanceCents ?? 0,
      totalRegisteredCents,
      totalAllocatedCents,
      unclassifiedCents,
      overAllocatedCents,
      notRegisteredCents,
      registrationDifferenceCents,
    },
    reconciliation: {
      state:
        registrationDifferenceCents === null
          ? "not_configured"
          : registrationDifferenceCents === 0
            ? "aligned"
            : registrationDifferenceCents > 0
              ? "registered_above_global"
              : "registered_below_global",
      differenceCents: registrationDifferenceCents,
    },
    holdings,
    purposes,
    allocations: serializedAllocations,
    purposeAllocations: serializedAllocations,
    distribution,
    assetClassDistribution: distribution,
    options: {
      assetClasses: investmentAssetClasses.map((value) => ({
        value,
        label: investmentAssetClassLabels[value],
      })),
      instrumentTypes: investmentInstrumentTypes.map((value) => ({
        value,
        label: investmentInstrumentTypeLabels[value],
      })),
    },
  };
}

function groupAllocations(
  rows: AllocationRow[],
  key: "holdingId" | "purposeId"
) {
  const grouped = new Map<string, AllocationRow[]>();

  for (const row of rows) {
    const groupKey = row[key];
    const current = grouped.get(groupKey) ?? [];
    current.push(row);
    grouped.set(groupKey, current);
  }

  return grouped;
}

function buildDistribution(
  holdings: HoldingRow[],
  globalBalanceCents: number | null,
  notRegisteredCents: number
) {
  const amounts = new Map<(typeof investmentAssetClasses)[number], number>();

  for (const holding of holdings) {
    amounts.set(
      holding.assetClass,
      (amounts.get(holding.assetClass) ?? 0) + holding.currentValueCents
    );
  }

  const denominatorCents = globalBalanceCents ?? holdings.reduce(
    (total, holding) => total + holding.currentValueCents,
    0
  );
  const distribution: Array<{
    assetClass: (typeof investmentAssetClasses)[number] | "not_registered";
    label: string;
    amountCents: number;
    percentage: number;
    color: string;
  }> = investmentAssetClasses
    .filter((assetClass) => (amounts.get(assetClass) ?? 0) > 0)
    .map((assetClass) => ({
      assetClass,
      label: investmentAssetClassLabels[assetClass],
      amountCents: amounts.get(assetClass) ?? 0,
      percentage: buildPercentage(amounts.get(assetClass) ?? 0, denominatorCents),
      color: assetClassColor(assetClass),
    }));

  if (notRegisteredCents > 0) {
    distribution.push({
      assetClass: "not_registered",
      label: "Não cadastrado",
      amountCents: notRegisteredCents,
      percentage: buildPercentage(notRegisteredCents, denominatorCents),
      color: "#f59e0b",
    });
  }

  return distribution;
}

function assetClassColor(assetClass: (typeof investmentAssetClasses)[number]) {
  const colors: Record<(typeof investmentAssetClasses)[number], string> = {
    fixed_income: "#22d3ee",
    equities: "#38bdf8",
    funds: "#818cf8",
    real_estate: "#a78bfa",
    crypto: "#f59e0b",
    cash: "#2dd4bf",
    other: "#94a3b8",
  };

  return colors[assetClass];
}
