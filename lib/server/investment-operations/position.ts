import {
investmentHoldings,
investmentOperations,
investmentQuotes
} from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { desc,eq } from "drizzle-orm";
import { z } from "zod";
import { writeInvestmentSnapshots } from "./snapshots";
import { Db,OperationRow,operationSchema,QUANTITY_SCALE } from "./validation";

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

export function operationValues(value: z.output<typeof operationSchema>) {
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

export async function assertOperationMatchesHolding(holding: typeof investmentHoldings.$inferSelect, type: OperationRow["type"]) {
  const fixedIncome = holding.assetClass === "fixed_income";
  invariant(
    type === "correction" || (fixedIncome ? ["application", "redemption"].includes(type) : ["buy", "sell"].includes(type)),
    "INVALID_OPERATION_TYPE",
    fixedIncome ? "Renda fixa aceita aplicação, resgate ou correção." : "Ativos cotados aceitam compra, venda ou correção."
  );
}

export async function assertOperationalHolding(db: Db, holdingId: string) {
  const holding = await db.query.investmentHoldings.findFirst({ where: eq(investmentHoldings.id, holdingId) });
  invariant(holding && !holding.isArchived, "INVESTMENT_HOLDING_NOT_FOUND", "Ativo não encontrado.", 404);
  return holding;
}

export async function recalculateHolding(db: Db, holdingId: string) {
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
