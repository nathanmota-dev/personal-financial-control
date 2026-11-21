import type { AppDb } from "@/lib/db";
import { investmentHoldings, investmentPurposeAllocations } from "@/lib/db/schema";
import type { RetireStalePositionInput, StalePosition } from "@/lib/interfaces/stale-positions";
import { invariant } from "@/lib/server/errors";
import { getFinanceToday } from "@/lib/server/runtime";
import { isStalePosition } from "@/lib/stale-positions";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { deleteInvestmentPurposeAllocation } from "./allocations";
import { archiveInvestmentHolding, updateInvestmentHolding } from "./holdings";
import { resolveDb } from "./validation";

type ReadDb = Pick<AppDb, "query">;

const retireSchema = z.object({ holdingId: z.string().uuid() });

/** Followed positions the bank still reports with an old value, oldest first. */
export async function listStalePositions(db: ReadDb, today = getFinanceToday()): Promise<StalePosition[]> {
  const holdings = await db.query.investmentHoldings.findMany();
  return holdings
    .filter((holding) => isStalePosition(holding, today))
    .map(({ id, name, currentValueCents, valueAsOf }) => ({ id, name, currentValueCents, valueAsOf }))
    .sort((left, right) => left.valueAsOf.localeCompare(right.valueAsOf) || left.id.localeCompare(right.id));
}

/**
 * Takes a stale position out of the total: its allocations are removed, its value goes to zero and it is archived,
 * so the next syncs ignore it. No transaction is created, because the redemption reached the account when it happened.
 */
export async function retireStalePosition(input: RetireStalePositionInput, database?: AppDb) {
  const db = await resolveDb(database);
  const { holdingId } = retireSchema.parse(input);
  const today = getFinanceToday();
  const holding = await db.query.investmentHoldings.findFirst({ where: eq(investmentHoldings.id, holdingId) });
  invariant(holding, "INVESTMENT_HOLDING_NOT_FOUND", "Ativo não encontrado.", 404);
  invariant(isStalePosition(holding, today), "POSITION_NOT_STALE", "O banco atualizou esta posição recentemente. Ela continua no total.");
  const allocations = await db.query.investmentPurposeAllocations.findMany({ where: eq(investmentPurposeAllocations.holdingId, holdingId) });
  for (const allocation of allocations) await deleteInvestmentPurposeAllocation(allocation.id, db);
  await updateInvestmentHolding({ id: holdingId, currentValueCents: 0, valueAsOf: today }, db);
  await archiveInvestmentHolding(holdingId, db);
  return { id: holdingId };
}
