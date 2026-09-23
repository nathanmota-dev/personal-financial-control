import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  investmentHoldings,
  investmentPortfolio,
  investmentPurposeAllocations,
  investmentPurposes,
  investmentReductionEvents,
  investmentReductionSources,
  transactions,
} from "@/lib/db/schema";
import type {
  InvestmentReductionSelection,
  InvestmentReductionSource,
  InvestmentReductionSourcesResult,
} from "@/lib/interfaces/investment-reconciliation";
import { calculateInvestmentBalance } from "@/lib/investment-projection";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";

type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type ReconciliationDb = AppDb | AppDbTransaction;

const sourceSelectionSchema = z
  .object({
    sourceId: z.string().trim().min(1).optional(),
    sourceType: z.enum(["allocation", "holding_free", "not_registered"]).optional(),
    holdingId: z.string().uuid().optional(),
    purposeId: z.string().uuid().optional(),
    allocationId: z.string().uuid().optional(),
    amountCents: z.number().int().positive(),
  })
  .superRefine((value, context) => {
    if (
      !value.sourceId &&
      value.sourceType !== "not_registered" &&
      !value.holdingId &&
      !value.allocationId
    ) {
      context.addIssue({
        code: "custom",
        message: "Investment reduction source is missing an identifier.",
        path: ["sourceId"],
      });
    }
  });

export const investmentReductionSelectionSchema = sourceSelectionSchema;

const reductionInputSchema = z.object({
  amountCents: z.number().int().positive(),
  eventType: z.enum(["withdrawal", "reconciliation"]),
  occurredOn: z.string(),
  transactionId: z.string().uuid().optional(),
  sourceSelections: z.array(sourceSelectionSchema).optional(),
  sources: z.array(sourceSelectionSchema).optional(),
});

export const investmentReductionSchema = reductionInputSchema;

export type InvestmentReductionSourcesOptions = {
  asOfDate?: string;
  transactionId?: string;
};

type ReductionInput = z.input<typeof reductionInputSchema>;
type SourceSelectionInput = z.input<typeof sourceSelectionSchema>;
type HoldingRow = typeof investmentHoldings.$inferSelect;
type PurposeRow = typeof investmentPurposes.$inferSelect;
type AllocationRow = typeof investmentPurposeAllocations.$inferSelect;

function resolveReadDb(database?: ReconciliationDb) {
  return database ?? getFinanceDatabase();
}

function sourceIdForAllocation(allocationId: string) {
  return `allocation:${allocationId}`;
}

function sourceIdForHolding(holdingId: string) {
  return `holding:${holdingId}`;
}

const notRegisteredSourceId = "not-registered";

function sourceSelectionsFromInput(input: {
  sourceSelections?: SourceSelectionInput[];
  sources?: SourceSelectionInput[];
}) {
  return input.sourceSelections ?? input.sources ?? [];
}

function normalizeSelection(selection: SourceSelectionInput): InvestmentReductionSelection & {
  sourceType?: SourceSelectionInput["sourceType"];
  holdingId?: string;
  purposeId?: string;
  allocationId?: string;
} {
  return {
    sourceId: selection.sourceId ?? buildSourceIdFromFields(selection),
    amountCents: selection.amountCents,
    sourceType: selection.sourceType,
    holdingId: selection.holdingId,
    purposeId: selection.purposeId,
    allocationId: selection.allocationId,
  };
}

function buildSourceIdFromFields(selection: SourceSelectionInput) {
  if (selection.sourceType === "not_registered") {
    return notRegisteredSourceId;
  }

  if (selection.sourceType === "allocation" && selection.allocationId) {
    return sourceIdForAllocation(selection.allocationId);
  }

  if (selection.allocationId) {
    return sourceIdForAllocation(selection.allocationId);
  }

  if (selection.sourceType === "holding_free" && selection.holdingId) {
    return sourceIdForHolding(selection.holdingId);
  }

  if (selection.holdingId) {
    return sourceIdForHolding(selection.holdingId);
  }

  throw new Error("Investment reduction source is missing an identifier.");
}

async function getInvestmentBalance(
  database: ReconciliationDb,
  asOfDate: string,
  portfolio?: typeof investmentPortfolio.$inferSelect
) {
  const currentPortfolio = portfolio ?? (await database.query.investmentPortfolio.findFirst());

  if (!currentPortfolio) {
    return null;
  }

  const movementRows = await database.query.transactions.findMany({
    where: and(
      inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]),
      eq(transactions.status, "posted"),
      eq(transactions.isIncludedInInvestmentCheckpoint, false),
      gte(transactions.transactionDate, currentPortfolio.checkpointDate),
      lte(transactions.transactionDate, asOfDate)
    ),
    orderBy: (table, { asc }) => [asc(table.transactionDate), asc(table.createdAt)],
  });

  return calculateInvestmentBalance({
    checkpointBalanceCents: currentPortfolio.checkpointBalanceCents,
    checkpointDate: currentPortfolio.checkpointDate,
    expectedMonthlyRateBps: currentPortfolio.expectedMonthlyRateBps,
    asOfDate,
    movements: movementRows.map((row) => ({
      id: row.id,
      date: row.transactionDate,
      amountCents: row.amountCents,
      direction:
        row.type === "investment_contribution" ? ("contribution" as const) : ("withdrawal" as const),
      description: row.description,
      source: "transaction" as const,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

function buildAllocationSource(
  allocation: AllocationRow,
  holding: HoldingRow,
  purpose: PurposeRow,
  availableCents: number
): InvestmentReductionSource {
  return {
    id: sourceIdForAllocation(allocation.id),
    sourceType: "allocation",
    label: `${holding.name} / ${purpose.name}`,
    description: "Caixinha alocada dentro do ativo",
    availableCents,
    holdingId: holding.id,
    holdingName: holding.name,
    allocationId: allocation.id,
    purposeId: purpose.id,
    purposeName: purpose.name,
    purposeColor: purpose.color,
  };
}

function buildHoldingFreeSource(
  holding: HoldingRow,
  availableCents: number
): InvestmentReductionSource {
  return {
    id: sourceIdForHolding(holding.id),
    sourceType: "holding_free",
    label: `${holding.name} / saldo livre`,
    description: "Saldo do ativo ainda não atribuído a uma caixinha",
    availableCents,
    holdingId: holding.id,
    holdingName: holding.name,
    allocationId: null,
    purposeId: null,
    purposeName: null,
    purposeColor: null,
  };
}

function buildNotRegisteredSource(availableCents: number): InvestmentReductionSource {
  return {
    id: notRegisteredSourceId,
    sourceType: "not_registered",
    label: "Patrimônio ainda não cadastrado",
    description: "Reduz apenas o saldo global, sem alterar um ativo da carteira",
    availableCents,
    holdingId: null,
    holdingName: null,
    allocationId: null,
    purposeId: null,
    purposeName: null,
    purposeColor: null,
  };
}

function addPreviousSelectionToSource(
  source: InvestmentReductionSource,
  previousSelections: InvestmentReductionSelection[]
) {
  const previousCents = previousSelections
    .filter((selection) => selection.sourceId === source.id)
    .reduce((total, selection) => total + selection.amountCents, 0);

  return {
    ...source,
    availableCents: source.availableCents + previousCents,
  };
}

export async function getInvestmentReductionSources(
  database?: ReconciliationDb,
  options: InvestmentReductionSourcesOptions = {}
): Promise<InvestmentReductionSourcesResult> {
  const db = await resolveReadDb(database);
  const asOfDate = normalizeDate(options.asOfDate ?? getFinanceToday());
  const portfolio = await db.query.investmentPortfolio.findFirst();

  if (!portfolio) {
    return {
      currentBalanceCents: 0,
      checkpointDate: null,
      totalAvailableCents: 0,
      sources: [],
      previousSelections: [],
    };
  }

  const [balance, holdings, purposes, allocations, previousEvent] = await Promise.all([
    getInvestmentBalance(db, asOfDate, portfolio),
    db.query.investmentHoldings.findMany({
      where: eq(investmentHoldings.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposes.findMany({
      where: eq(investmentPurposes.isArchived, false),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    db.query.investmentPurposeAllocations.findMany({
      orderBy: (table, { asc }) => [asc(table.allocatedOn), asc(table.createdAt)],
    }),
    options.transactionId
      ? db.query.investmentReductionEvents.findFirst({
          where: and(
            eq(investmentReductionEvents.transactionId, options.transactionId),
            eq(investmentReductionEvents.status, "active")
          ),
        })
      : Promise.resolve(undefined),
  ]);

  const previousRows = previousEvent
    ? await db.query.investmentReductionSources.findMany({
        where: eq(investmentReductionSources.eventId, previousEvent.id),
      })
    : [];
  const previousSelections = previousRows
    .map((source) => {
      if (source.sourceType === "allocation" && source.allocationId) {
        return { sourceId: sourceIdForAllocation(source.allocationId), amountCents: source.amountCents };
      }

      if (source.sourceType === "holding_free" && source.holdingId) {
        return { sourceId: sourceIdForHolding(source.holdingId), amountCents: source.amountCents };
      }

      if (source.sourceType === "not_registered") {
        return { sourceId: notRegisteredSourceId, amountCents: source.amountCents };
      }

      return null;
    })
    .filter((source): source is InvestmentReductionSelection => source !== null);

  const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));
  const purposesById = new Map(purposes.map((purpose) => [purpose.id, purpose]));
  const reservePurposeIds = new Set(
    purposes.filter((purpose) => purpose.kind === "emergency_reserve").map((purpose) => purpose.id)
  );
  const reserveHoldingIds = new Set(
    allocations
      .filter((allocation) => reservePurposeIds.has(allocation.purposeId))
      .map((allocation) => allocation.holdingId)
  );
  const allocatedByHolding = new Map<string, number>();
  const sourcesById = new Map<string, InvestmentReductionSource>();

  for (const allocation of allocations) {
    const holding = holdingsById.get(allocation.holdingId);
    const purpose = purposesById.get(allocation.purposeId);

    if (!holding || !purpose) {
      continue;
    }

    if (reservePurposeIds.size > 0 && !reservePurposeIds.has(purpose.id)) continue;

    allocatedByHolding.set(
      holding.id,
      (allocatedByHolding.get(holding.id) ?? 0) + allocation.amountCents
    );

    if (allocation.amountCents > 0) {
      const source = buildAllocationSource(allocation, holding, purpose, allocation.amountCents);
      sourcesById.set(source.id, source);
    }
  }

  for (const holding of holdings) {
    if (reservePurposeIds.size > 0 && !reserveHoldingIds.has(holding.id)) continue;
    const freeCents = Math.max(
      holding.currentValueCents - (allocatedByHolding.get(holding.id) ?? 0),
      0
    );

    if (freeCents > 0) {
      const source = buildHoldingFreeSource(holding, freeCents);
      sourcesById.set(source.id, source);
    }
  }

  const totalRegisteredCents = holdings.filter((holding) => reservePurposeIds.size === 0 || reserveHoldingIds.has(holding.id)).reduce(
    (total, holding) => total + holding.currentValueCents,
    0
  );
  const notRegisteredCents = Math.max(
    (balance?.balanceCents ?? 0) - totalRegisteredCents,
    0
  );

  if (notRegisteredCents > 0) {
    sourcesById.set(notRegisteredSourceId, buildNotRegisteredSource(notRegisteredCents));
  }

  for (const previousSelection of previousSelections) {
    if (!sourcesById.has(previousSelection.sourceId)) {
      const historicalSource = previousRows.find((source) => {
        if (source.sourceType === "allocation" && source.allocationId) {
          return sourceIdForAllocation(source.allocationId) === previousSelection.sourceId;
        }
        if (source.sourceType === "holding_free" && source.holdingId) {
          return sourceIdForHolding(source.holdingId) === previousSelection.sourceId;
        }
        return source.sourceType === "not_registered";
      });

      if (historicalSource?.sourceType === "allocation" && historicalSource.allocationId) {
        const allocation = allocations.find((item) => item.id === historicalSource.allocationId);
        const holding = allocation ? holdingsById.get(allocation.holdingId) : undefined;
        const purpose = allocation ? purposesById.get(allocation.purposeId) : undefined;

        if (allocation && holding && purpose) {
          sourcesById.set(
            previousSelection.sourceId,
            buildAllocationSource(allocation, holding, purpose, 0)
          );
        }
      }

      if (historicalSource?.sourceType === "holding_free" && historicalSource.holdingId) {
        const holding = holdingsById.get(historicalSource.holdingId);

        if (holding) {
          sourcesById.set(previousSelection.sourceId, buildHoldingFreeSource(holding, 0));
        }
      }

      if (historicalSource?.sourceType === "not_registered") {
        sourcesById.set(notRegisteredSourceId, buildNotRegisteredSource(0));
      }
    }
  }

  const sources = [...sourcesById.values()]
    .map((source) => addPreviousSelectionToSource(source, previousSelections))
    .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));

  return {
    currentBalanceCents: balance?.balanceCents ?? 0,
    checkpointDate: portfolio.checkpointDate,
    totalAvailableCents: sources.reduce((total, source) => total + source.availableCents, 0),
    sources,
    previousSelections,
  };
}

function sourceMap(result: InvestmentReductionSourcesResult) {
  return new Map(result.sources.map((source) => [source.id, source]));
}

function ensureSelectionsClose(
  amountCents: number,
  selections: InvestmentReductionSelection[]
) {
  const totalSelectedCents = selections.reduce((total, selection) => total + selection.amountCents, 0);

  invariant(
    totalSelectedCents === amountCents,
    "INVESTMENT_REDUCTION_DOES_NOT_CLOSE",
    `A distribuição de fontes deve fechar exatamente ${amountCents} centavos.`
  );

  const ids = new Set<string>();
  for (const selection of selections) {
    invariant(
      !ids.has(selection.sourceId),
      "INVESTMENT_REDUCTION_DUPLICATE_SOURCE",
      "A mesma fonte não pode ser selecionada duas vezes."
    );
    ids.add(selection.sourceId);
  }
}

function ensureSourceAmounts(
  selections: InvestmentReductionSelection[],
  sources: InvestmentReductionSourcesResult
) {
  const availableById = sourceMap(sources);

  for (const selection of selections) {
    const source = availableById.get(selection.sourceId);
    invariant(
      source,
      "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND",
      "Uma das fontes selecionadas não está mais disponível. Atualize a página e tente novamente."
    );
    invariant(
      selection.amountCents <= source.availableCents,
      "INVESTMENT_REDUCTION_EXCEEDS_SOURCE",
      `A fonte ${source.label} não possui saldo suficiente para esta redução.`
    );
  }
}

function hasRegisteredSources(sources: InvestmentReductionSource[]) {
  return sources.some((source) => source.sourceType !== "not_registered");
}

function selectionSourceType(
  selection: InvestmentReductionSelection & {
    sourceType?: SourceSelectionInput["sourceType"];
  },
  source: InvestmentReductionSource
) {
  return selection.sourceType ?? source.sourceType;
}

async function applyInvestmentReductionInTransaction(
  transaction: AppDbTransaction,
  rawInput: ReductionInput
) {
  const values = reductionInputSchema.parse(rawInput);
  const occurredOn = normalizeDate(values.occurredOn);
  const rawSelections = sourceSelectionsFromInput(values);
  const selections = rawSelections.map(normalizeSelection);
  const sourceResult = await getInvestmentReductionSources(transaction, {
    asOfDate: getFinanceToday(),
    transactionId: values.transactionId,
  });

  if (values.eventType === "withdrawal") {
    const notRegistered = sourceResult.sources.find(
      (source) => source.sourceType === "not_registered"
    );
    if (notRegistered) {
      notRegistered.availableCents += values.amountCents;
    }
  }

  if (selections.length === 0) {
    invariant(
      !hasRegisteredSources(sourceResult.sources),
      "INVESTMENT_REDUCTION_SELECTION_REQUIRED",
      "Escolha de quais ativos e caixinhas saiu esta redução."
    );
  } else {
    ensureSelectionsClose(values.amountCents, selections);
    ensureSourceAmounts(selections, sourceResult);
  }

  const sourcesById = sourceMap(sourceResult);
  const allocationReductions = new Map<string, number>();
  const holdingReductions = new Map<string, number>();
  const sourceRows: Array<{
    sourceType: "allocation" | "holding_free" | "not_registered";
    holdingId: string | null;
    purposeId: string | null;
    allocationId: string | null;
    amountCents: number;
  }> = [];

  for (const selection of selections) {
    const source = sourcesById.get(selection.sourceId);
    invariant(source, "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND", "Investment reduction source not found.");
    const sourceType = selectionSourceType(selection, source);

    invariant(
      sourceType === source.sourceType,
      "INVESTMENT_REDUCTION_SOURCE_MISMATCH",
      "A fonte selecionada não corresponde ao tipo esperado."
    );

    if (sourceType === "allocation") {
      invariant(source.allocationId && source.holdingId, "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND", "A alocação selecionada não existe mais.");
      allocationReductions.set(
        source.allocationId,
        (allocationReductions.get(source.allocationId) ?? 0) + selection.amountCents
      );
      holdingReductions.set(
        source.holdingId,
        (holdingReductions.get(source.holdingId) ?? 0) + selection.amountCents
      );
      sourceRows.push({
        sourceType,
        holdingId: source.holdingId,
        purposeId: source.purposeId,
        allocationId: source.allocationId,
        amountCents: selection.amountCents,
      });
      continue;
    }

    if (sourceType === "holding_free") {
      invariant(source.holdingId, "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND", "O ativo selecionado não existe mais.");
      holdingReductions.set(
        source.holdingId,
        (holdingReductions.get(source.holdingId) ?? 0) + selection.amountCents
      );
      sourceRows.push({
        sourceType,
        holdingId: source.holdingId,
        purposeId: null,
        allocationId: null,
        amountCents: selection.amountCents,
      });
      continue;
    }

    sourceRows.push({
      sourceType: "not_registered",
      holdingId: null,
      purposeId: null,
      allocationId: null,
      amountCents: selection.amountCents,
    });
  }

  const allocationRows = await transaction.query.investmentPurposeAllocations.findMany({
    where: inArray(investmentPurposeAllocations.id, [...allocationReductions.keys()]),
  });
  const allocationsById = new Map(allocationRows.map((allocation) => [allocation.id, allocation]));
  const holdingRows = await transaction.query.investmentHoldings.findMany({
    where: inArray(investmentHoldings.id, [...holdingReductions.keys()]),
  });
  const holdingsById = new Map(holdingRows.map((holding) => [holding.id, holding]));
  const purposeIds = allocationRows.map((allocation) => allocation.purposeId);
  const purposeRows = purposeIds.length
    ? await transaction.query.investmentPurposes.findMany({
        where: inArray(investmentPurposes.id, purposeIds),
      })
    : [];
  const purposesById = new Map(purposeRows.map((purpose) => [purpose.id, purpose]));

  for (const [allocationId, amountCents] of allocationReductions) {
    const allocation = allocationsById.get(allocationId);
    invariant(
      allocation,
      "INVESTMENT_REDUCTION_ALLOCATION_NOT_FOUND",
      "A alocação selecionada não existe mais."
    );
    const purpose = purposesById.get(allocation.purposeId);
    const holding = holdingsById.get(allocation.holdingId);
    invariant(
      holding && purpose,
      "INVESTMENT_REDUCTION_SOURCE_NOT_FOUND",
      "O ativo ou a caixinha selecionada não existe mais."
    );
    invariant(!holding.isArchived, "ARCHIVED_HOLDING_REDUCTION", "Ativos arquivados não podem ser reduzidos.");
    invariant(!purpose.isArchived, "ARCHIVED_PURPOSE_REDUCTION", "Caixinhas arquivadas não podem ser reduzidas.");
    invariant(
      amountCents <= allocation.amountCents,
      "INVESTMENT_REDUCTION_EXCEEDS_SOURCE",
      "A redução excede o saldo disponível na alocação."
    );
  }

  for (const [holdingId, amountCents] of holdingReductions) {
    const holding = holdingsById.get(holdingId);
    invariant(holding, "INVESTMENT_HOLDING_NOT_FOUND", "O ativo selecionado não existe mais.");
    invariant(!holding.isArchived, "ARCHIVED_HOLDING_REDUCTION", "Ativos arquivados não podem ser reduzidos.");
    invariant(
      amountCents <= holding.currentValueCents,
      "INVESTMENT_REDUCTION_EXCEEDS_SOURCE",
      `O ativo ${holding.name} não possui saldo suficiente para esta redução.`
    );

    const allAllocations = await transaction.query.investmentPurposeAllocations.findMany({
      where: eq(investmentPurposeAllocations.holdingId, holdingId),
    });
    const currentAllocatedCents = allAllocations.reduce(
      (total, allocation) => total + allocation.amountCents,
      0
    );
    const allocationReductionCents = allAllocations.reduce(
      (total, allocation) => total + (allocationReductions.get(allocation.id) ?? 0),
      0
    );

    invariant(
      currentAllocatedCents - allocationReductionCents <= holding.currentValueCents - amountCents,
      "INVESTMENT_REDUCTION_BREAKS_ALLOCATION",
      "A redução deixaria as caixinhas acima do valor atual do ativo."
    );
  }

  const timestamp = currentTimestamp();
  const [event] = await transaction
    .insert(investmentReductionEvents)
    .values({
      type: values.eventType,
      status: "active",
      transactionId: values.transactionId ?? null,
      amountCents: values.amountCents,
      occurredOn,
      updatedAt: timestamp,
    })
    .returning();
  invariant(event, "INVESTMENT_REDUCTION_EVENT_FAILED", "Não foi possível registrar a redução.", 500);

  for (const [allocationId, amountCents] of allocationReductions) {
    const allocation = allocationsById.get(allocationId);
    invariant(allocation, "INVESTMENT_REDUCTION_ALLOCATION_NOT_FOUND", "A alocação selecionada não existe mais.");
    const [updated] = await transaction
      .update(investmentPurposeAllocations)
      .set({ amountCents: allocation.amountCents - amountCents, updatedAt: timestamp })
      .where(eq(investmentPurposeAllocations.id, allocationId))
      .returning();
    invariant(updated, "INVESTMENT_REDUCTION_ALLOCATION_UPDATE_FAILED", "Não foi possível reduzir a alocação.", 500);
  }

  for (const [holdingId, amountCents] of holdingReductions) {
    const holding = holdingsById.get(holdingId);
    invariant(holding, "INVESTMENT_HOLDING_NOT_FOUND", "O ativo selecionado não existe mais.");
    const [updated] = await transaction
      .update(investmentHoldings)
      .set({ currentValueCents: holding.currentValueCents - amountCents, updatedAt: timestamp })
      .where(eq(investmentHoldings.id, holdingId))
      .returning();
    invariant(updated, "INVESTMENT_REDUCTION_HOLDING_UPDATE_FAILED", "Não foi possível reduzir o ativo.", 500);
  }

  const insertedSources = sourceRows.length
    ? await transaction
        .insert(investmentReductionSources)
        .values(
          sourceRows.map((source) => ({
            eventId: event.id,
            ...source,
            updatedAt: timestamp,
          }))
        )
        .returning()
    : [];

  invariant(
    insertedSources.length === sourceRows.length,
    "INVESTMENT_REDUCTION_SOURCE_FAILED",
    "Não foi possível registrar todas as fontes da redução.",
    500
  );

  return {
    event: serializeTimestamps(event),
    selections: sourceRows.map((source) => ({
      sourceId:
        source.sourceType === "allocation" && source.allocationId
          ? sourceIdForAllocation(source.allocationId)
          : source.sourceType === "holding_free" && source.holdingId
            ? sourceIdForHolding(source.holdingId)
            : notRegisteredSourceId,
      amountCents: source.amountCents,
    })),
  };
}

export async function applyInvestmentReduction(
  input: z.input<typeof investmentReductionSchema>,
  database?: AppDb
) {
  const db = database ?? (await getFinanceDatabase());
  return db.transaction((transaction) => applyInvestmentReductionInTransaction(transaction, input));
}

export async function reverseInvestmentReductionEvent(
  eventId: string,
  transaction: AppDbTransaction
) {
  const event = await transaction.query.investmentReductionEvents.findFirst({
    where: and(
      eq(investmentReductionEvents.id, eventId),
      eq(investmentReductionEvents.status, "active")
    ),
  });

  if (!event) {
    return false;
  }

  const sources = await transaction.query.investmentReductionSources.findMany({
    where: eq(investmentReductionSources.eventId, event.id),
  });
  const allocationRestores = new Map<string, number>();
  const holdingRestores = new Map<string, number>();

  for (const source of sources) {
    if (source.sourceType === "allocation") {
      invariant(
        source.allocationId && source.holdingId,
        "INVESTMENT_REDUCTION_SOURCE_MISSING",
        "A origem de uma redução não está mais disponível para reversão."
      );
      allocationRestores.set(
        source.allocationId,
        (allocationRestores.get(source.allocationId) ?? 0) + source.amountCents
      );
      holdingRestores.set(
        source.holdingId,
        (holdingRestores.get(source.holdingId) ?? 0) + source.amountCents
      );
    }

    if (source.sourceType === "holding_free") {
      invariant(
        source.holdingId,
        "INVESTMENT_REDUCTION_SOURCE_MISSING",
        "A origem de uma redução não está mais disponível para reversão."
      );
      holdingRestores.set(
        source.holdingId,
        (holdingRestores.get(source.holdingId) ?? 0) + source.amountCents
      );
    }
  }

  const allocationRows = await transaction.query.investmentPurposeAllocations.findMany({
    where: inArray(investmentPurposeAllocations.id, [...allocationRestores.keys()]),
  });
  const allocationsById = new Map(allocationRows.map((allocation) => [allocation.id, allocation]));
  const holdingRows = await transaction.query.investmentHoldings.findMany({
    where: inArray(investmentHoldings.id, [...holdingRestores.keys()]),
  });
  const holdingsById = new Map(holdingRows.map((holding) => [holding.id, holding]));
  const purposeRows = allocationRows.length
    ? await transaction.query.investmentPurposes.findMany({
        where: inArray(
          investmentPurposes.id,
          allocationRows.map((allocation) => allocation.purposeId)
        ),
      })
    : [];
  const purposesById = new Map(purposeRows.map((purpose) => [purpose.id, purpose]));

  for (const [allocationId, amountCents] of allocationRestores) {
    const allocation = allocationsById.get(allocationId);
    invariant(allocation, "INVESTMENT_REDUCTION_SOURCE_MISSING", "A alocação de uma redução não existe mais.");
    const purpose = purposesById.get(allocation.purposeId);
    invariant(purpose && !purpose.isArchived, "ARCHIVED_PURPOSE_REDUCTION", "Reative a caixinha antes de editar este resgate.");
    const [updated] = await transaction
      .update(investmentPurposeAllocations)
      .set({ amountCents: allocation.amountCents + amountCents, updatedAt: currentTimestamp() })
      .where(eq(investmentPurposeAllocations.id, allocationId))
      .returning();
    invariant(updated, "INVESTMENT_REDUCTION_RESTORE_FAILED", "Não foi possível restaurar a alocação.", 500);
  }

  for (const [holdingId, amountCents] of holdingRestores) {
    const holding = holdingsById.get(holdingId);
    invariant(holding && !holding.isArchived, "ARCHIVED_HOLDING_REDUCTION", "Reative o ativo antes de editar este resgate.");
    const [updated] = await transaction
      .update(investmentHoldings)
      .set({ currentValueCents: holding.currentValueCents + amountCents, updatedAt: currentTimestamp() })
      .where(eq(investmentHoldings.id, holdingId))
      .returning();
    invariant(updated, "INVESTMENT_REDUCTION_RESTORE_FAILED", "Não foi possível restaurar o ativo.", 500);
  }

  const [reversed] = await transaction
    .update(investmentReductionEvents)
    .set({ status: "reversed", reversedAt: currentTimestamp(), updatedAt: currentTimestamp() })
    .where(eq(investmentReductionEvents.id, event.id))
    .returning();
  invariant(reversed, "INVESTMENT_REDUCTION_REVERSE_FAILED", "Não foi possível reverter a redução.", 500);

  return true;
}

export async function reverseInvestmentReductionForTransaction(
  transactionId: string,
  database: AppDbTransaction
) {
  const event = await database.query.investmentReductionEvents.findFirst({
    where: and(
      eq(investmentReductionEvents.transactionId, transactionId),
      eq(investmentReductionEvents.status, "active")
    ),
  });

  return event ? reverseInvestmentReductionEvent(event.id, database) : false;
}

export async function applyInvestmentReductionInExistingTransaction(
  database: AppDbTransaction,
  input: z.input<typeof investmentReductionSchema>
) {
  return applyInvestmentReductionInTransaction(database, input);
}
