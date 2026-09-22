import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  fixedIncomeSubtypes,
  fixedIncomeTerms,
  investmentAssetClasses,
  investmentHoldings,
  investmentInstrumentTypes,
  investmentOperations,
  investmentOperationTypes,
  investmentPurposeAllocations,
  investmentPurposes,
  investmentQuotes,
  investmentValuationModes,
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";

const QUANTITY_SCALE = BigInt(100_000_000);
type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type Db = AppDb | AppDbTransaction;
type OperationRow = typeof investmentOperations.$inferSelect;

const nullableText = z.string().trim().nullable().optional();
const assetSchema = z.object({
  name: z.string().trim().min(1),
  ticker: nullableText,
  institutionName: nullableText,
  assetClass: z.enum(investmentAssetClasses),
  instrumentType: z.enum(investmentInstrumentTypes),
  valuationMode: z.enum(investmentValuationModes),
  quoteSymbol: nullableText,
  notes: nullableText,
});
const operationSchema = z.object({
  holdingId: z.string().uuid(),
  type: z.enum(investmentOperationTypes),
  operatedOn: z.string().min(1),
  settledOn: nullableText,
  quantity: z.string().trim().default("0"),
  unitPriceCents: z.number().int().nonnegative().nullable().optional(),
  grossAmountCents: z.number().int().nonnegative(),
  feesCents: z.number().int().nonnegative().default(0),
  targetCostCents: z.number().int().nonnegative().nullable().optional(),
  notes: nullableText,
});
const quoteSchema = z.object({
  holdingId: z.string().uuid(),
  quotedOn: z.string().min(1),
  unitPriceCents: z.number().int().positive(),
});
const termsSchema = z.object({
  holdingId: z.string().uuid(),
  subtype: z.enum(fixedIncomeSubtypes),
  issuer: nullableText,
  indexer: nullableText,
  rateBps: z.number().int().nullable().optional(),
  maturityDate: nullableText,
  liquidity: nullableText,
});

async function dbOrDefault(database?: Db): Promise<Db> {
  return database ?? getFinanceDatabase();
}

function textOrNull(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function quantityToUnits(value: string) {
  invariant(/^\d+(?:\.\d{1,8})?$/.test(value), "INVALID_QUANTITY", "Use até oito casas decimais na quantidade.");
  const [whole, fraction = ""] = value.split(".");
  const units = BigInt(whole) * QUANTITY_SCALE + BigInt(fraction.padEnd(8, "0"));
  invariant(units <= BigInt(Number.MAX_SAFE_INTEGER), "QUANTITY_TOO_LARGE", "A quantidade informada é muito alta.");
  return Number(units);
}

export function unitsToQuantity(units: number) {
  const value = BigInt(units);
  const whole = value / QUANTITY_SCALE;
  const fraction = (value % QUANTITY_SCALE).toString().padStart(8, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function calculateInvestmentPosition(operations: OperationRow[]) {
  let quantityUnits = BigInt(0);
  let costCents = BigInt(0);
  let realizedResultCents = BigInt(0);
  let appliedCapitalCents = BigInt(0);

  for (const operation of [...operations].sort((a, b) =>
    a.operatedOn.localeCompare(b.operatedOn) || a.createdAt.getTime() - b.createdAt.getTime()
  )) {
    const quantity = BigInt(operation.quantityUnits);
    const gross = BigInt(operation.grossAmountCents);
    const fees = BigInt(operation.feesCents);
    if (operation.type === "buy") {
      quantityUnits += quantity;
      costCents += gross + fees;
    } else if (operation.type === "sell") {
      invariant(quantity <= quantityUnits, "INSUFFICIENT_POSITION", "A venda não pode superar a posição disponível.");
      const removedCost = quantityUnits === BigInt(0) ? BigInt(0) : (costCents * quantity) / quantityUnits;
      quantityUnits -= quantity;
      costCents -= removedCost;
      realizedResultCents += gross - fees - removedCost;
    } else if (operation.type === "application") {
      appliedCapitalCents += gross + fees;
      costCents += gross + fees;
    } else if (operation.type === "redemption") {
      invariant(gross <= appliedCapitalCents, "INSUFFICIENT_POSITION", "O resgate não pode superar o capital aplicado.");
      const removedCost = appliedCapitalCents === BigInt(0) ? BigInt(0) : (costCents * gross) / appliedCapitalCents;
      appliedCapitalCents -= gross;
      costCents -= removedCost;
      realizedResultCents += gross - fees - removedCost;
    } else {
      quantityUnits = quantity;
      costCents = BigInt(operation.targetCostCents ?? operation.grossAmountCents);
      appliedCapitalCents = operation.quantityUnits === 0 ? costCents : BigInt(0);
    }
  }
  return {
    quantityUnits: Number(quantityUnits),
    quantity: unitsToQuantity(Number(quantityUnits)),
    costCents: Number(costCents),
    averagePriceCents: quantityUnits > BigInt(0) ? Number((costCents * QUANTITY_SCALE) / quantityUnits) : null,
    realizedResultCents: Number(realizedResultCents),
    appliedCapitalCents: Number(appliedCapitalCents),
  };
}

async function assertOperationalHolding(db: Db, holdingId: string) {
  const holding = await db.query.investmentHoldings.findFirst({ where: eq(investmentHoldings.id, holdingId) });
  invariant(holding && !holding.isArchived, "INVESTMENT_HOLDING_NOT_FOUND", "Ativo não encontrado.", 404);
  return holding;
}

async function recalculateHolding(db: Db, holdingId: string) {
  const holding = await assertOperationalHolding(db, holdingId);
  const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, holdingId) });
  const position = calculateInvestmentPosition(operations);
  const quote = await db.query.investmentQuotes.findFirst({
    where: eq(investmentQuotes.holdingId, holdingId),
    orderBy: [desc(investmentQuotes.quotedOn), desc(investmentQuotes.createdAt)],
  });
  const currentValueCents = holding.valuationMode === "market_quote" && quote
    ? Number((BigInt(position.quantityUnits) * BigInt(quote.unitPriceCents)) / QUANTITY_SCALE)
    : holding.currentValueCents;
  await db.update(investmentHoldings).set({
    currentValueCents,
    valueAsOf: quote?.quotedOn ?? holding.valueAsOf,
    updatedAt: currentTimestamp(),
  }).where(eq(investmentHoldings.id, holdingId));
  return { ...position, currentValueCents };
}

export async function createOperationalInvestmentAsset(input: z.input<typeof assetSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = assetSchema.parse(input);
  const [created] = await db.insert(investmentHoldings).values({
    ...value,
    ticker: textOrNull(value.ticker),
    institutionName: textOrNull(value.institutionName),
    quoteSymbol: textOrNull(value.quoteSymbol),
    notes: textOrNull(value.notes),
    currency: "BRL",
    currentValueCents: 0,
    valueAsOf: getFinanceToday(),
  }).returning();
  invariant(created, "HOLDING_CREATE_FAILED", "Não foi possível cadastrar o ativo.", 500);
  return serializeTimestamps(created);
}

export async function createInvestmentOperation(input: z.input<typeof operationSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = operationSchema.parse(input);
  const quantityUnits = quantityToUnits(value.quantity);
  invariant(value.type === "correction" ? Boolean(value.notes?.trim()) : true, "CORRECTION_NOTES_REQUIRED", "Correções exigem uma observação.");
  invariant(["application", "redemption"].includes(value.type) || quantityUnits > 0, "INVALID_QUANTITY", "Informe uma quantidade maior que zero.");
  await assertOperationalHolding(db, value.holdingId);
  const [created] = await db.insert(investmentOperations).values({ ...value, operatedOn: normalizeDate(value.operatedOn), settledOn: value.settledOn ? normalizeDate(value.settledOn) : null, quantityUnits, notes: textOrNull(value.notes), unitPriceCents: value.unitPriceCents ?? null, targetCostCents: value.targetCostCents ?? null }).returning();
  try { await recalculateHolding(db, value.holdingId); } catch (error) { if (created) await db.delete(investmentOperations).where(eq(investmentOperations.id, created.id)); throw error; }
  return serializeTimestamps(created!);
}

export async function updateInvestmentOperation(id: string, input: z.input<typeof operationSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = operationSchema.parse(input);
  const existing = await db.query.investmentOperations.findFirst({ where: eq(investmentOperations.id, id) });
  invariant(existing, "INVESTMENT_OPERATION_NOT_FOUND", "Operação não encontrada.", 404);
  const quantityUnits = quantityToUnits(value.quantity);
  invariant(value.type !== "correction" || Boolean(value.notes?.trim()), "CORRECTION_NOTES_REQUIRED", "Correções exigem uma observação.");
  await db.update(investmentOperations).set({ ...value, operatedOn: normalizeDate(value.operatedOn), settledOn: value.settledOn ? normalizeDate(value.settledOn) : null, quantityUnits, notes: textOrNull(value.notes), updatedAt: currentTimestamp() }).where(eq(investmentOperations.id, id));
  await recalculateHolding(db, existing.holdingId);
}

export async function deleteInvestmentOperation(id: string, database?: Db) {
  const db = await dbOrDefault(database);
  const existing = await db.query.investmentOperations.findFirst({ where: eq(investmentOperations.id, id) });
  invariant(existing, "INVESTMENT_OPERATION_NOT_FOUND", "Operação não encontrada.", 404);
  await db.delete(investmentOperations).where(eq(investmentOperations.id, id));
  await recalculateHolding(db, existing.holdingId);
}

export async function registerManualInvestmentQuote(input: z.input<typeof quoteSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = quoteSchema.parse(input);
  await assertOperationalHolding(db, value.holdingId);
  await db.insert(investmentQuotes).values({ ...value, quotedOn: normalizeDate(value.quotedOn) }).onConflictDoUpdate({ target: [investmentQuotes.holdingId, investmentQuotes.quotedOn], set: { unitPriceCents: value.unitPriceCents, updatedAt: currentTimestamp() } });
  return recalculateHolding(db, value.holdingId);
}

export async function updateManualInvestmentBalance(input: { holdingId: string; currentValueCents: number; valueAsOf: string }, database?: Db) {
  const db = await dbOrDefault(database);
  const holding = await assertOperationalHolding(db, input.holdingId);
  invariant(holding.valuationMode !== "market_quote", "QUOTE_VALUED_HOLDING", "Ativos cotados devem ser atualizados por cotação.");
  await db.update(investmentHoldings).set({ currentValueCents: input.currentValueCents, valueAsOf: normalizeDate(input.valueAsOf), updatedAt: currentTimestamp() }).where(eq(investmentHoldings.id, input.holdingId));
}

export async function updateFixedIncomeTerms(input: z.input<typeof termsSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = termsSchema.parse(input);
  await assertOperationalHolding(db, value.holdingId);
  await db.insert(fixedIncomeTerms).values({ ...value, issuer: textOrNull(value.issuer), indexer: textOrNull(value.indexer), maturityDate: textOrNull(value.maturityDate), liquidity: textOrNull(value.liquidity) }).onConflictDoUpdate({ target: fixedIncomeTerms.holdingId, set: { ...value, updatedAt: currentTimestamp() } });
}

export async function listLongTermInvestmentPositions(database?: Db) {
  const db = await dbOrDefault(database);
  const [holdings, reserve] = await Promise.all([
    db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false), orderBy: [asc(investmentHoldings.name)] }),
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
  ]);
  const reserveAllocations = reserve ? await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, reserve.id) }) : [];
  const reserveHoldingIds = new Set(reserveAllocations.map((item) => item.holdingId));
  return Promise.all(holdings.filter((holding) => !reserveHoldingIds.has(holding.id)).map(async (holding) => {
    const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, holding.id), orderBy: [asc(investmentOperations.operatedOn), asc(investmentOperations.createdAt)] });
    const position = calculateInvestmentPosition(operations);
    return { ...serializeTimestamps(holding), position, resultCents: holding.currentValueCents - position.costCents };
  }));
}

export async function getInvestmentAssetDetails(id: string, database?: Db) {
  const db = await dbOrDefault(database);
  const holding = await db.query.investmentHoldings.findFirst({ where: and(eq(investmentHoldings.id, id), eq(investmentHoldings.isArchived, false)) });
  if (!holding) return null;
  const [operations, quotes, terms] = await Promise.all([
    db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, id), orderBy: [desc(investmentOperations.operatedOn), desc(investmentOperations.createdAt)] }),
    db.query.investmentQuotes.findMany({ where: eq(investmentQuotes.holdingId, id), orderBy: [desc(investmentQuotes.quotedOn)] }),
    db.query.fixedIncomeTerms.findFirst({ where: eq(fixedIncomeTerms.holdingId, id) }),
  ]);
  const position = calculateInvestmentPosition(operations);
  return { ...serializeTimestamps(holding), position, operations: operations.map(serializeTimestamps), quotes: quotes.map(serializeTimestamps), terms: terms ? serializeTimestamps(terms) : null, resultCents: holding.currentValueCents - position.costCents };
}

export async function getInvestmentOverview(database?: Db) {
  const db = await dbOrDefault(database);
  const [positions, reservePurpose] = await Promise.all([
    listLongTermInvestmentPositions(db),
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
  ]);
  const reserveAllocations = reservePurpose ? await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, reservePurpose.id) }) : [];
  const reserveCents = reserveAllocations.reduce((total, row) => total + row.amountCents, 0);
  const portfolioCents = positions.reduce((total, row) => total + row.currentValueCents, 0);
  const knownCostCents = positions.reduce((total, row) => total + (row.position?.costCents ?? 0), 0);
  const knownValueCents = positions.reduce((total, row) => total + (row.position ? row.currentValueCents : 0), 0);
  const distribution = investmentAssetClasses.map((assetClass) => ({ assetClass, amountCents: positions.filter((row) => row.assetClass === assetClass).reduce((sum, row) => sum + row.currentValueCents, 0) })).filter((item) => item.amountCents > 0);
  return { totalCents: reserveCents + portfolioCents, reserve: { amountCents: reserveCents, purposeId: reservePurpose?.id ?? null, configured: Boolean(reservePurpose) }, portfolioCents, knownCostCents, resultCents: knownValueCents - knownCostCents, distribution, lastUpdatedAt: positions.map((row) => row.updatedAt).sort().at(-1) ?? null };
}
