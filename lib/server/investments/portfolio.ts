import type { AppDb } from "@/lib/db";
import { investmentPortfolio } from "@/lib/db/schema";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp,normalizeDate,serializeTimestamps } from "@/lib/server/finance";
import {
applyInvestmentReductionInExistingTransaction,
getInvestmentReductionSources,
} from "@/lib/server/investment-reconciliation";
import { getFinanceToday } from "@/lib/server/runtime";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateCheckpointDate } from "./planned-movements";
import { includeMovementsThroughDate } from "./projection";
import { checkpointSchema,InvestmentDb,investmentSettingsSchema,portfolioSchema,resolveDb,resolveReadDb } from "./validation";

export async function configureInvestmentPortfolio(
  input: z.input<typeof portfolioSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = portfolioSchema.parse(input);
  values.checkpointDate = normalizeDate(values.checkpointDate);
  validateCheckpointDate(values.checkpointDate);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPortfolio.findFirst();
    invariant(
      !existing || values.checkpointDate >= existing.checkpointDate,
      "CHECKPOINT_DATE_MUST_ADVANCE",
      "The new checkpoint date cannot be before the current checkpoint."
    );
    const timestamp = currentTimestamp();
    let savedPortfolio;

    if (!existing) {
      [savedPortfolio] = await transaction
        .insert(investmentPortfolio)
        .values({
          ...values,
          updatedAt: timestamp,
        })
        .returning();
    } else {
      [savedPortfolio] = await transaction
        .update(investmentPortfolio)
        .set({
          ...values,
          updatedAt: timestamp,
        })
        .where(eq(investmentPortfolio.id, existing.id))
        .returning();
    }

    await includeMovementsThroughDate(values.checkpointDate, transaction, timestamp);

    return serializeTimestamps(savedPortfolio);
  });
}

export async function updateInvestmentSettings(
  input: z.input<typeof investmentSettingsSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = investmentSettingsSchema.parse(input);
  const existing = await db.query.investmentPortfolio.findFirst();

  invariant(existing, "INVESTMENT_PORTFOLIO_NOT_FOUND", "Configure the investment portfolio first.", 404);

  const [updated] = await db
    .update(investmentPortfolio)
    .set({
      expectedMonthlyRateBps: values.expectedMonthlyRateBps,
      updatedAt: currentTimestamp(),
    })
    .where(eq(investmentPortfolio.id, existing.id))
    .returning();

  return serializeTimestamps(updated);
}

export async function reconcileInvestmentBalance(
  input: z.input<typeof checkpointSchema>,
  database?: AppDb
) {
  const db = await resolveDb(database);
  const values = checkpointSchema.parse(input);
  values.checkpointDate = normalizeDate(values.checkpointDate);
  validateCheckpointDate(values.checkpointDate);

  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPortfolio.findFirst();

    invariant(existing, "INVESTMENT_PORTFOLIO_NOT_FOUND", "Configure the investment portfolio first.", 404);
    invariant(
      values.checkpointDate >= existing.checkpointDate,
      "CHECKPOINT_DATE_MUST_ADVANCE",
      "The new checkpoint date cannot be before the current checkpoint."
    );

    const currentBalance = await getInvestmentReductionSources(transaction, {
      asOfDate: getFinanceToday(),
    });
    const reductionCents = Math.max(
      currentBalance.currentBalanceCents - values.checkpointBalanceCents,
      0
    );

    if (reductionCents > 0) {
      await applyInvestmentReductionInExistingTransaction(transaction, {
        amountCents: reductionCents,
        eventType: "reconciliation",
        occurredOn: values.checkpointDate,
        sourceSelections: values.sourceSelections ?? values.sources,
      });
    }

    const timestamp = currentTimestamp();
    const [updated] = await transaction
      .update(investmentPortfolio)
      .set({
        checkpointBalanceCents: values.checkpointBalanceCents,
        checkpointDate: values.checkpointDate,
        updatedAt: timestamp,
      })
      .where(eq(investmentPortfolio.id, existing.id))
      .returning();

    await includeMovementsThroughDate(values.checkpointDate, transaction, timestamp);

    return serializeTimestamps(updated);
  });
}

export async function getInvestmentPortfolio(database?: InvestmentDb) {
  const db = await resolveReadDb(database);
  const portfolio = await db.query.investmentPortfolio.findFirst();

  return portfolio ? serializeTimestamps(portfolio) : null;
}
