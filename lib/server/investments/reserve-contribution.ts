import type { AppDb } from "@/lib/db";
import { investmentHoldings, investmentPortfolio, recurringTemplates } from "@/lib/db/schema";
import type { InvestmentMovement } from "@/lib/investment-projection";
import type { ReserveContributionPlan, SetReserveContributionInput } from "@/lib/interfaces/reserve-contribution";
import { buildMonthlyContributions, isReserveCategory, recurringMonthlyCents } from "@/lib/reserve-contribution";
import { invariant } from "@/lib/server/errors";
import { currentTimestamp } from "@/lib/server/finance";
import { getFinanceToday } from "@/lib/server/runtime";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { isBankReserveMode } from "./bank-reserve";
import { addDaysToDate, addMonthsToDate, listPlannedInvestmentMovements } from "./planned-movements";
import { InvestmentDb, resolveDb } from "./validation";

const PROJECTION_MONTHS = 600;
const contributionSchema = z.object({ monthlyContributionCents: z.number().int().nonnegative().nullable() });

async function reserveCategoryIds(db: InvestmentDb) {
  const categories = await db.query.categories.findMany();
  return new Set(categories.filter(isReserveCategory).map((category) => category.id));
}

async function reserveRecurringMonthlyCents(db: InvestmentDb, categoryIds: ReadonlySet<string>, asOfDate: string) {
  if (!categoryIds.size) return 0;
  const templates = await db.query.recurringTemplates.findMany({ where: and(eq(recurringTemplates.type, "investment_contribution"), eq(recurringTemplates.status, "active")) });
  return recurringMonthlyCents(templates.filter((template) => categoryIds.has(template.categoryId)), asOfDate);
}

/**
 * Only entries of the reserve category feed the reserve projection; other investments belong to the portfolio.
 * A saved monthly amount replaces the planned contributions, and planned withdrawals still apply.
 */
export async function planReserveMovements(db: InvestmentDb, asOfDate: string, savedMonthlyCents: number | null | undefined): Promise<{ plannedMovements: InvestmentMovement[]; contribution: ReserveContributionPlan }> {
  const categoryIds = await reserveCategoryIds(db);
  const [planned, recurringCents] = await Promise.all([
    categoryIds.size ? listPlannedInvestmentMovements(db, addDaysToDate(asOfDate, 1), addMonthsToDate(asOfDate, PROJECTION_MONTHS), categoryIds) : Promise.resolve([]),
    reserveRecurringMonthlyCents(db, categoryIds, asOfDate),
  ]);
  const custom = savedMonthlyCents ?? null;
  const contribution: ReserveContributionPlan = { source: custom === null ? "recurring" : "custom", monthlyCents: custom ?? recurringCents, recurringMonthlyCents: recurringCents, hasReserveCategory: categoryIds.size > 0 };
  if (custom === null) return { plannedMovements: planned, contribution };
  const plannedMovements = [...planned.filter((movement) => movement.direction === "withdrawal"), ...buildMonthlyContributions(asOfDate, custom, PROJECTION_MONTHS)]
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));
  return { plannedMovements, contribution };
}

/** `null` goes back to the reserve category's recurring entries. */
export async function setReserveMonthlyContribution(input: SetReserveContributionInput, database?: AppDb) {
  const db = await resolveDb(database);
  const { monthlyContributionCents } = contributionSchema.parse(input);
  return db.transaction(async (transaction) => {
    const existing = await transaction.query.investmentPortfolio.findFirst();
    const updatedAt = currentTimestamp();
    if (existing) {
      await transaction.update(investmentPortfolio).set({ reserveMonthlyContributionCents: monthlyContributionCents, updatedAt }).where(eq(investmentPortfolio.id, existing.id));
      return { monthlyContributionCents };
    }
    const holdings = await transaction.query.investmentHoldings.findMany({ where: eq(investmentHoldings.isArchived, false) });
    invariant(isBankReserveMode(holdings), "INVESTMENT_PORTFOLIO_NOT_FOUND", "Configure a reserva antes de simular o aporte mensal.", 404);
    await transaction.insert(investmentPortfolio).values({ checkpointBalanceCents: 0, expectedMonthlyRateBps: 0, checkpointDate: getFinanceToday(), reserveMonthlyContributionCents: monthlyContributionCents, updatedAt });
    return { monthlyContributionCents };
  });
}
