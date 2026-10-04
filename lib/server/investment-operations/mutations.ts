import type { AppDb } from "@/lib/db";
import {
fixedIncomeTerms,
investmentHoldings,
investmentOperations,
investmentQuotes
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp,normalizeDate,serializeTimestamps } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { and,eq } from "drizzle-orm";
import { z } from "zod";
import { assertOperationalHolding,assertOperationMatchesHolding,calculateInvestmentPosition,operationValues,recalculateHolding } from "./position";
import { assetSchema,Db,dbOrDefault,operationSchema,quoteSchema,supportedTypes,termsSchema,textOrNull } from "./validation";

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
