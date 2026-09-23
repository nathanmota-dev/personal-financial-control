import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  fixedIncomeSubtypes,
  fixedIncomeIndexers,
  fixedIncomeTerms,
  investmentAssetClasses,
  investmentHoldings,
  investmentInstrumentTypes,
  investmentOperations,
  investmentPortfolioSnapshots,
  investmentPositionSnapshots,
  investmentOperationTypes,
  investmentPurposeAllocations,
  investmentPurposes,
  investmentQuotes,
  investmentValuationModes,
} from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env";
import type { InvestmentQuoteRefreshResult, MarketDataProvider } from "@/lib/interfaces/market-data";
import { BrapiMarketDataProvider } from "@/lib/server/brapi";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp, normalizeDate, serializeTimestamps } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { getInvestmentProjection } from "@/lib/server/investments";

const QUANTITY_SCALE = BigInt(100_000_000);
type AppDbTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];
type Db = AppDb | AppDbTransaction;
type OperationRow = typeof investmentOperations.$inferSelect;

const nullableText = z.string().trim().nullable().optional();
const assetSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["stock", "real_estate_fund", "etf", "treasury", "cdb", "lci", "lca"]).optional(),
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
  grossAmountCents: z.number().int().nonnegative().optional(),
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
  indexer: z.enum(fixedIncomeIndexers).nullable().optional(),
  indexerPercentageBps: z.number().int().positive().max(100_000).nullable().optional(),
  rateBps: z.number().int().nullable().optional(),
  maturityDate: nullableText,
  liquidity: nullableText,
});

const supportedTypes = {
  stock: { assetClass: "equities", instrumentType: "stock", valuationMode: "market_quote" },
  real_estate_fund: { assetClass: "real_estate", instrumentType: "real_estate_fund", valuationMode: "market_quote" },
  etf: { assetClass: "funds", instrumentType: "etf", valuationMode: "market_quote" },
  treasury: { assetClass: "fixed_income", instrumentType: "treasury", valuationMode: "manual_balance" },
  cdb: { assetClass: "fixed_income", instrumentType: "cdb", valuationMode: "manual_balance" },
  lci: { assetClass: "fixed_income", instrumentType: "lci_lca", valuationMode: "manual_balance" },
  lca: { assetClass: "fixed_income", instrumentType: "lci_lca", valuationMode: "manual_balance" },
} as const;

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

function operationValues(value: z.output<typeof operationSchema>) {
  const quantityUnits = quantityToUnits(value.quantity);
  const quotedGross = value.unitPriceCents == null
    ? null
    : Number((BigInt(quantityUnits) * BigInt(value.unitPriceCents)) / QUANTITY_SCALE);
  const grossAmountCents = ["buy", "sell"].includes(value.type)
    ? quotedGross ?? value.grossAmountCents
    : value.grossAmountCents;
  invariant(grossAmountCents !== null && grossAmountCents !== undefined, "INVALID_AMOUNT", "Informe o valor da operação.");
  invariant(value.type !== "correction" || Boolean(value.notes?.trim()), "CORRECTION_NOTES_REQUIRED", "Correções exigem uma observação.");
  invariant(["application", "redemption"].includes(value.type) || value.type === "correction" || quantityUnits > 0, "INVALID_QUANTITY", "Informe uma quantidade maior que zero.");
  invariant(!["buy", "sell"].includes(value.type) || (value.unitPriceCents ?? value.grossAmountCents ?? 0) > 0, "UNIT_PRICE_REQUIRED", "Informe o preço unitário.");
  return { quantityUnits, grossAmountCents };
}

async function assertOperationMatchesHolding(holding: typeof investmentHoldings.$inferSelect, type: OperationRow["type"]) {
  const fixedIncome = holding.assetClass === "fixed_income";
  invariant(
    type === "correction" || (fixedIncome ? ["application", "redemption"].includes(type) : ["buy", "sell"].includes(type)),
    "INVALID_OPERATION_TYPE",
    fixedIncome ? "Renda fixa aceita aplicação, resgate ou correção." : "Ativos cotados aceitam compra, venda ou correção."
  );
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
  await writeInvestmentSnapshots(db, holdingId, {
    ...position,
    currentValueCents,
    unitPriceCents: quote?.unitPriceCents ?? null,
    valuationSource: holding.valuationMode === "market_quote" ? "market_quote" : "manual_balance",
    costKnown: operations.length > 0,
  });
  return { ...position, currentValueCents };
}

async function writeInvestmentSnapshots(db: Db, holdingId: string, position: {
  quantityUnits: number; costCents: number; currentValueCents: number; unitPriceCents: number | null;
  valuationSource: "market_quote" | "manual_balance"; costKnown: boolean;
}) {
  const snapshotDate = getFinanceToday();
  const timestamp = currentTimestamp();
  await db.insert(investmentPositionSnapshots).values({
    holdingId, snapshotDate, quantityUnits: position.quantityUnits,
    costCents: position.costKnown ? position.costCents : null,
    currentValueCents: position.currentValueCents, unitPriceCents: position.unitPriceCents,
    valuationSource: position.valuationSource,
  }).onConflictDoUpdate({
    target: [investmentPositionSnapshots.holdingId, investmentPositionSnapshots.snapshotDate],
    set: { quantityUnits: position.quantityUnits, costCents: position.costKnown ? position.costCents : null,
      currentValueCents: position.currentValueCents, unitPriceCents: position.unitPriceCents,
      valuationSource: position.valuationSource, updatedAt: timestamp },
  });

  const holdings = await db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false) });
  const reserve = await db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) });
  const reserveRows = reserve ? await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, reserve.id) }) : [];
  const reserveIds = new Set(reserveRows.map((row) => row.holdingId));
  let knownCostCents = 0, knownValueCents = 0, totalValueCents = 0;
  for (const item of holdings.filter((row) => !reserveIds.has(row.id))) {
    const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, item.id) });
    totalValueCents += item.id === holdingId ? position.currentValueCents : item.currentValueCents;
    if (operations.length) {
      knownCostCents += item.id === holdingId ? position.costCents : calculateInvestmentPosition(operations).costCents;
      knownValueCents += item.id === holdingId ? position.currentValueCents : item.currentValueCents;
    }
  }
  await db.insert(investmentPortfolioSnapshots).values({ snapshotDate, knownCostCents, knownValueCents, totalValueCents, unrealizedResultCents: knownValueCents - knownCostCents })
    .onConflictDoUpdate({ target: investmentPortfolioSnapshots.snapshotDate, set: { knownCostCents, knownValueCents, totalValueCents, unrealizedResultCents: knownValueCents - knownCostCents, updatedAt: timestamp } });
}

export async function createOperationalInvestmentAsset(input: z.input<typeof assetSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = assetSchema.parse(input);
  const derived = value.type ? supportedTypes[value.type] : null;
  const ticker = textOrNull(value.ticker)?.toUpperCase() ?? null;
  const quoteSymbol = (textOrNull(value.quoteSymbol) ?? ticker)?.toUpperCase() ?? null;
  const valuationMode = derived?.valuationMode ?? value.valuationMode;
  invariant(valuationMode !== "market_quote" || Boolean(quoteSymbol), "QUOTE_SYMBOL_REQUIRED", "Informe o ticker do ativo cotado.");
  if (quoteSymbol) {
    const duplicate = await db.query.investmentHoldings.findFirst({ where: and(eq(investmentHoldings.quoteSymbol, quoteSymbol), eq(investmentHoldings.isArchived, false)) });
    invariant(!duplicate, "DUPLICATE_QUOTE_SYMBOL", "Já existe um ativo ativo com este ticker.");
  }
  const [created] = await db.insert(investmentHoldings).values({
    name: value.name,
    ticker,
    institutionName: textOrNull(value.institutionName),
    assetClass: derived?.assetClass ?? value.assetClass,
    instrumentType: derived?.instrumentType ?? value.instrumentType,
    valuationMode,
    quoteSymbol,
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
  const root = db as AppDb;
  return root.transaction(async (transaction) => {
    const holding = await assertOperationalHolding(transaction, value.holdingId);
    await assertOperationMatchesHolding(holding, value.type);
    const computed = operationValues(value);
    const [created] = await transaction.insert(investmentOperations).values({ ...value, grossAmountCents: computed.grossAmountCents, operatedOn: normalizeDate(value.operatedOn), settledOn: value.settledOn ? normalizeDate(value.settledOn) : null, quantityUnits: computed.quantityUnits, notes: textOrNull(value.notes), unitPriceCents: value.unitPriceCents ?? null, targetCostCents: value.targetCostCents ?? null }).returning();
    await recalculateHolding(transaction, value.holdingId);
    return serializeTimestamps(created!);
  });
}

export async function updateInvestmentOperation(id: string, input: z.input<typeof operationSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = operationSchema.parse(input);
  return (db as AppDb).transaction(async (transaction) => {
    const existing = await transaction.query.investmentOperations.findFirst({ where: eq(investmentOperations.id, id) });
    invariant(existing, "INVESTMENT_OPERATION_NOT_FOUND", "Operação não encontrada.", 404);
    invariant(value.holdingId === existing.holdingId, "OPERATION_HOLDING_IMMUTABLE", "Não é possível mover uma operação para outro ativo.");
    const holding = await assertOperationalHolding(transaction, existing.holdingId);
    await assertOperationMatchesHolding(holding, value.type);
    const computed = operationValues(value);
    await transaction.update(investmentOperations).set({ ...value, grossAmountCents: computed.grossAmountCents, operatedOn: normalizeDate(value.operatedOn), settledOn: value.settledOn ? normalizeDate(value.settledOn) : null, quantityUnits: computed.quantityUnits, notes: textOrNull(value.notes), updatedAt: currentTimestamp() }).where(eq(investmentOperations.id, id));
    await recalculateHolding(transaction, existing.holdingId);
  });
}

export async function deleteInvestmentOperation(id: string, database?: Db) {
  const db = await dbOrDefault(database);
  return (db as AppDb).transaction(async (transaction) => {
    const existing = await transaction.query.investmentOperations.findFirst({ where: eq(investmentOperations.id, id) });
    invariant(existing, "INVESTMENT_OPERATION_NOT_FOUND", "Operação não encontrada.", 404);
    await transaction.delete(investmentOperations).where(eq(investmentOperations.id, id));
    await recalculateHolding(transaction, existing.holdingId);
  });
}

export async function registerManualInvestmentQuote(input: z.input<typeof quoteSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = quoteSchema.parse(input);
  await assertOperationalHolding(db, value.holdingId);
  const holding = await assertOperationalHolding(db, value.holdingId);
  await db.insert(investmentQuotes).values({ ...value, quotedOn: normalizeDate(value.quotedOn), provider: "manual", source: "manual", symbol: holding.quoteSymbol, currency: holding.currency, quotedAt: currentTimestamp(), fetchedAt: currentTimestamp(), marketState: "unknown", isStale: false }).onConflictDoUpdate({ target: [investmentQuotes.holdingId, investmentQuotes.quotedOn], set: { unitPriceCents: value.unitPriceCents, provider: "manual", source: "manual", quotedAt: currentTimestamp(), fetchedAt: currentTimestamp(), isStale: false, updatedAt: currentTimestamp() } });
  return recalculateHolding(db, value.holdingId);
}

export async function updateManualInvestmentBalance(input: { holdingId: string; currentValueCents: number; valueAsOf: string }, database?: Db) {
  const db = await dbOrDefault(database);
  const holding = await assertOperationalHolding(db, input.holdingId);
  invariant(holding.valuationMode !== "market_quote", "QUOTE_VALUED_HOLDING", "Ativos cotados devem ser atualizados por cotação.");
  await db.update(investmentHoldings).set({ currentValueCents: input.currentValueCents, valueAsOf: normalizeDate(input.valueAsOf), updatedAt: currentTimestamp() }).where(eq(investmentHoldings.id, input.holdingId));
  await recalculateHolding(db, input.holdingId);
}

export async function updateFixedIncomeTerms(input: z.input<typeof termsSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = termsSchema.parse(input);
  const holding = await assertOperationalHolding(db, value.holdingId);
  invariant(holding.assetClass === "fixed_income", "FIXED_INCOME_REQUIRED", "Termos só podem ser cadastrados para renda fixa.");
  if (value.maturityDate) normalizeDate(value.maturityDate);
  await db.insert(fixedIncomeTerms).values({ ...value, issuer: textOrNull(value.issuer), maturityDate: textOrNull(value.maturityDate), liquidity: textOrNull(value.liquidity) }).onConflictDoUpdate({ target: fixedIncomeTerms.holdingId, set: { ...value, updatedAt: currentTimestamp() } });
}

export async function updateOperationalInvestmentAsset(id: string, input: z.input<typeof assetSchema>, database?: Db) {
  const db = await dbOrDefault(database);
  const value = assetSchema.parse(input);
  const holding = await assertOperationalHolding(db, id);
  const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, id) });
  const derived = value.type ? supportedTypes[value.type] : null;
  const assetClass = derived?.assetClass ?? value.assetClass;
  const instrumentType = derived?.instrumentType ?? value.instrumentType;
  invariant(!operations.length || (assetClass === holding.assetClass && instrumentType === holding.instrumentType), "ASSET_TYPE_LOCKED", "O tipo do ativo não pode mudar depois da primeira operação.");
  const ticker = textOrNull(value.ticker)?.toUpperCase() ?? null;
  const quoteSymbol = (textOrNull(value.quoteSymbol) ?? ticker)?.toUpperCase() ?? null;
  const valuationMode = derived?.valuationMode ?? value.valuationMode;
  invariant(valuationMode !== "market_quote" || Boolean(quoteSymbol), "QUOTE_SYMBOL_REQUIRED", "Informe o ticker do ativo cotado.");
  const [updated] = await db.update(investmentHoldings).set({ name: value.name, ticker, institutionName: textOrNull(value.institutionName), assetClass, instrumentType, valuationMode, quoteSymbol, notes: textOrNull(value.notes), updatedAt: currentTimestamp() }).where(eq(investmentHoldings.id, id)).returning();
  return serializeTimestamps(updated!);
}

export async function archiveOperationalInvestmentAsset(id: string, database?: Db) {
  const db = await dbOrDefault(database);
  const holding = await assertOperationalHolding(db, id);
  const position = calculateInvestmentPosition(await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, id) }));
  invariant(position.quantityUnits === 0 && position.appliedCapitalCents === 0, "ACTIVE_POSITION", "Zere a posição antes de arquivar o ativo.");
  await db.update(investmentHoldings).set({ isArchived: true, updatedAt: currentTimestamp() }).where(eq(investmentHoldings.id, holding.id));
}

export async function convertLegacyInvestmentAsset(id: string, input: { type: keyof typeof supportedTypes; initialCostCents: number; initialQuantity?: string; operatedOn: string }, database?: Db) {
  const db = await dbOrDefault(database);
  await assertOperationalHolding(db, id);
  const existing = await db.query.investmentOperations.findFirst({ where: eq(investmentOperations.holdingId, id) });
  invariant(!existing, "ALREADY_OPERATIONAL", "Este ativo já possui histórico operacional.");
  const derived = supportedTypes[input.type];
  await db.update(investmentHoldings).set({ ...derived, updatedAt: currentTimestamp() }).where(eq(investmentHoldings.id, id));
  const quantity = derived.assetClass === "fixed_income" ? "0" : input.initialQuantity ?? "0";
  return createInvestmentOperation({ holdingId: id, type: "correction", operatedOn: input.operatedOn, quantity, grossAmountCents: input.initialCostCents, targetCostCents: input.initialCostCents, notes: "Conversão de posição legada" }, db);
}

export async function listLongTermInvestmentPositions(database?: Db) {
  const db = await dbOrDefault(database);
  const [holdings, reserve] = await Promise.all([
    db.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false), orderBy: [asc(investmentHoldings.name)] }),
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
  ]);
  const reserveAllocations = reserve ? await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, reserve.id) }) : [];
  const reserveHoldingIds = new Set(reserveAllocations.map((item) => item.holdingId));
  const positions = await Promise.all(holdings.filter((holding) => !reserveHoldingIds.has(holding.id)).map(async (holding) => {
    const operations = await db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, holding.id), orderBy: [asc(investmentOperations.operatedOn), asc(investmentOperations.createdAt)] });
    const position = operations.length ? calculateInvestmentPosition(operations) : null;
    const latestQuote = await db.query.investmentQuotes.findFirst({ where: eq(investmentQuotes.holdingId, holding.id), orderBy: [desc(investmentQuotes.quotedOn), desc(investmentQuotes.createdAt)] });
    return { ...serializeTimestamps(holding), position, resultCents: position ? holding.currentValueCents - position.costCents : null,
      participationPercentage: 0, latestQuote: latestQuote ? serializeTimestamps(latestQuote) : null };
  }));
  const totalCents = positions.reduce((total, position) => total + position.currentValueCents, 0);
  return positions.map((position) => ({ ...position, participationPercentage: totalCents ? position.currentValueCents / totalCents * 100 : 0 }));
}

export async function getInvestmentAssetDetails(id: string, database?: Db) {
  const db = await dbOrDefault(database);
  const holding = await db.query.investmentHoldings.findFirst({ where: and(eq(investmentHoldings.id, id), eq(investmentHoldings.isArchived, false)) });
  if (!holding) return null;
  const [operations, quotes, terms, snapshots] = await Promise.all([
    db.query.investmentOperations.findMany({ where: eq(investmentOperations.holdingId, id), orderBy: [desc(investmentOperations.operatedOn), desc(investmentOperations.createdAt)] }),
    db.query.investmentQuotes.findMany({ where: eq(investmentQuotes.holdingId, id), orderBy: [desc(investmentQuotes.quotedOn)] }),
    db.query.fixedIncomeTerms.findFirst({ where: eq(fixedIncomeTerms.holdingId, id) }),
    db.query.investmentPositionSnapshots.findMany({ where: eq(investmentPositionSnapshots.holdingId, id), orderBy: [asc(investmentPositionSnapshots.snapshotDate)] }),
  ]);
  const position = operations.length ? calculateInvestmentPosition(operations) : null;
  return { ...serializeTimestamps(holding), position, operations: operations.map(serializeTimestamps), quotes: quotes.map(serializeTimestamps), terms: terms ? serializeTimestamps(terms) : null, snapshots: snapshots.map(serializeTimestamps), resultCents: position ? holding.currentValueCents - position.costCents : null };
}

export async function getInvestmentOverview(database?: Db) {
  const db = await dbOrDefault(database);
  const [positions, reservePurpose, projection, history] = await Promise.all([
    listLongTermInvestmentPositions(db),
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
    getInvestmentProjection(db),
    db.query.investmentPortfolioSnapshots.findMany({ orderBy: [asc(investmentPortfolioSnapshots.snapshotDate)] }),
  ]);
  const reserveCents = projection?.currentBalanceCents ?? 0;
  const portfolioCents = positions.reduce((total, row) => total + row.currentValueCents, 0);
  const knownCostCents = positions.reduce((total, row) => total + (row.position?.costCents ?? 0), 0);
  const knownValueCents = positions.reduce((total, row) => total + (row.position ? row.currentValueCents : 0), 0);
  const distribution = investmentAssetClasses.map((assetClass) => ({ assetClass, amountCents: positions.filter((row) => row.assetClass === assetClass).reduce((sum, row) => sum + row.currentValueCents, 0) })).filter((item) => item.amountCents > 0);
  return { totalCents: reserveCents + portfolioCents, reserve: { amountCents: reserveCents, purposeId: reservePurpose?.id ?? null, configured: Boolean(projection) }, portfolioCents, knownCostCents, resultCents: knownValueCents - knownCostCents, distribution, history: history.map(serializeTimestamps), lastUpdatedAt: positions.map((row) => row.updatedAt).sort().at(-1) ?? null };
}

export async function getEmergencyReserveComposition(database?: Db) {
  const db = await dbOrDefault(database);
  const [purpose, projection] = await Promise.all([
    db.query.investmentPurposes.findFirst({ where: and(eq(investmentPurposes.kind, "emergency_reserve"), eq(investmentPurposes.isArchived, false)) }),
    getInvestmentProjection(db),
  ]);
  if (!purpose) return { officialBalanceCents: projection?.currentBalanceCents ?? 0, registeredCents: 0, differenceCents: projection?.currentBalanceCents ?? 0, holdings: [] };
  const allocations = await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.purposeId, purpose.id) });
  const holdings = await Promise.all(allocations.map(async (allocation) => {
    const holding = await db.query.investmentHoldings.findFirst({ where: eq(investmentHoldings.id, allocation.holdingId) });
    return holding ? { id: holding.id, name: holding.name, institutionName: holding.institutionName, amountCents: allocation.amountCents, valueAsOf: holding.valueAsOf } : null;
  }));
  const activeHoldings = holdings.filter((holding): holding is NonNullable<typeof holding> => holding !== null);
  const registeredCents = activeHoldings.reduce((total, holding) => total + holding.amountCents, 0);
  const officialBalanceCents = projection?.currentBalanceCents ?? 0;
  return { officialBalanceCents, registeredCents, differenceCents: officialBalanceCents - registeredCents, holdings: activeHoldings };
}

export async function refreshInvestmentQuotes(options: { provider?: MarketDataProvider; now?: Date; cooldownMinutes?: number } = {}, database?: Db): Promise<InvestmentQuoteRefreshResult> {
  const db = await dbOrDefault(database);
  const env = getServerEnv();
  const provider = options.provider ?? (env.BRAPI_API_TOKEN ? new BrapiMarketDataProvider(env.BRAPI_API_TOKEN) : null);
  invariant(provider, "MARKET_DATA_NOT_CONFIGURED", "Configure BRAPI_API_TOKEN para habilitar a atualização automática.");
  const now = options.now ?? new Date();
  const cooldown = options.cooldownMinutes ?? env.INVESTMENT_QUOTE_MIN_INTERVAL_MINUTES;
  const holdings = await db.query.investmentHoldings.findMany({ where: and(eq(investmentHoldings.valuationMode, "market_quote"), eq(investmentHoldings.isArchived, false)), orderBy: [asc(investmentHoldings.name)] });
  const items: InvestmentQuoteRefreshResult["items"] = [];
  for (const holding of holdings) {
    const symbol = holding.quoteSymbol ?? holding.ticker;
    if (!symbol) { items.push({ holdingId: holding.id, symbol: "—", status: "failed", message: "Ticker não configurado." }); continue; }
    const latest = await db.query.investmentQuotes.findFirst({ where: eq(investmentQuotes.holdingId, holding.id), orderBy: [desc(investmentQuotes.fetchedAt), desc(investmentQuotes.createdAt)] });
    if (latest?.fetchedAt && now.getTime() - latest.fetchedAt.getTime() < cooldown * 60_000) {
      items.push({ holdingId: holding.id, symbol, status: "cooldown" }); continue;
    }
    try {
      const quote = await provider.getQuote(symbol);
      const quotedOn = quote.quotedAt.toISOString().slice(0, 10);
      await db.insert(investmentQuotes).values({ holdingId: holding.id, quotedOn, unitPriceCents: quote.unitPriceCents, source: provider.name, provider: provider.name, symbol: quote.symbol, currency: quote.currency, quotedAt: quote.quotedAt, fetchedAt: now, marketState: quote.marketState, isStale: false })
        .onConflictDoUpdate({ target: [investmentQuotes.holdingId, investmentQuotes.quotedOn], set: { unitPriceCents: quote.unitPriceCents, source: provider.name, provider: provider.name, symbol: quote.symbol, currency: quote.currency, quotedAt: quote.quotedAt, fetchedAt: now, marketState: quote.marketState, isStale: false, updatedAt: currentTimestamp() } });
      await recalculateHolding(db, holding.id);
      items.push({ holdingId: holding.id, symbol, status: "updated" });
    } catch (error) {
      if (latest) await db.update(investmentQuotes).set({ isStale: true, updatedAt: currentTimestamp() }).where(eq(investmentQuotes.id, latest.id));
      items.push({ holdingId: holding.id, symbol, status: "failed", message: error instanceof Error ? error.message : "Falha desconhecida." });
    }
  }
  return { updated: items.filter((item) => item.status === "updated").length, skippedByCooldown: items.filter((item) => item.status === "cooldown").length, failed: items.filter((item) => item.status === "failed").length, refreshedAt: now.toISOString(), snapshotDate: items.some((item) => item.status === "updated") ? getFinanceToday() : null, items };
}
