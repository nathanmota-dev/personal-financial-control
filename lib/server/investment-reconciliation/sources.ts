import {
investmentPortfolio,
transactions
} from "@/lib/db/schema";
import type {
InvestmentReductionSelection,
InvestmentReductionSource
} from "@/lib/interfaces/investment-reconciliation";
import { calculateInvestmentBalance } from "@/lib/investment-projection";
import { and,eq,gte,inArray,lte } from "drizzle-orm";
import { AllocationRow,HoldingRow,notRegisteredSourceId,PurposeRow,ReconciliationDb,sourceIdForAllocation,sourceIdForHolding } from "./validation";

export async function getInvestmentBalance(
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

export function buildAllocationSource(
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

export function buildHoldingFreeSource(
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

export function buildNotRegisteredSource(availableCents: number): InvestmentReductionSource {
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

export function addPreviousSelectionToSource(
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
