import { recurringTemplates,transactions } from "@/lib/db/schema";
import {
type InvestmentMovement
} from "@/lib/investment-projection";
import { invariant } from "@/lib/server/errors";
import { recurringOccurrences as getExistingRecurringOccurrences } from "@/lib/server/recurring-occurrences";
import { getFinanceToday } from "@/lib/server/runtime";
import { addMonthsToMonth,buildDateInMonth } from "@/lib/utils/finance-month";
import { and,eq,gte,inArray,isNull,lte,or } from "drizzle-orm";
import { toInvestmentMovement } from "./projection";
import { InvestmentDb } from "./validation";

export async function listPlannedInvestmentMovements(
  database: InvestmentDb,
  startDate: string,
  endDate: string
) {
  const rows = await database.query.transactions.findMany({
    where: and(
      inArray(transactions.type, ["investment_contribution", "investment_withdrawal"]),
      inArray(transactions.status, ["pending", "posted"]),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    ),
  });
  const transactionMovements = rows.map((row) => toInvestmentMovement(row));
  const contributionTemplates = await database.query.recurringTemplates.findMany({
    where: and(
      eq(recurringTemplates.type, "investment_contribution"),
      eq(recurringTemplates.status, "active"),
      lte(recurringTemplates.startMonth, endDate.slice(0, 7)),
      or(
        isNull(recurringTemplates.endMonth),
        gte(recurringTemplates.endMonth, startDate.slice(0, 7))
      )
    ),
  });
  const existingOccurrences = await getExistingRecurringOccurrences(
    database,
    startDate.slice(0, 7),
    endDate.slice(0, 7),
    contributionTemplates.map((template) => template.id)
  );
  const recurringMovements: InvestmentMovement[] = [];

  for (const template of contributionTemplates) {
    for (const month of listMonths(startDate.slice(0, 7), endDate.slice(0, 7))) {
      if (
        month < template.startMonth ||
        (template.endMonth !== null && template.endMonth !== undefined && month > template.endMonth)
      ) {
        continue;
      }

      if (existingOccurrences.has(`${template.id}:${month}`)) {
        continue;
      }

      const date = buildDateInMonth(month, template.dayOfMonth);

      if (date < startDate || date > endDate) {
        continue;
      }

      recurringMovements.push({
        id: `${template.id}:${month}`,
        date,
        amountCents: template.amountCents,
        direction: "contribution",
        source: "recurring",
        createdAt: template.createdAt.toISOString(),
      });
    }
  }

  return [...transactionMovements, ...recurringMovements].sort((left, right) => {
    return (
      left.date.localeCompare(right.date) ||
      (left.createdAt ?? "").localeCompare(right.createdAt ?? "") ||
      left.id.localeCompare(right.id)
    );
  });
}

export { recurringOccurrences as getExistingRecurringOccurrences } from "@/lib/server/recurring-occurrences";

export function listMonths(startMonth: string, endMonth: string) {
  const months: string[] = [];
  let cursor = startMonth;

  while (cursor <= endMonth) {
    months.push(cursor);
    cursor = addMonthsToMonth(cursor, 1);
  }

  return months;
}

export function addMonthsToDate(date: string, amount: number) {
  return `${addMonthsToMonth(date.slice(0, 7), amount)}-${date.slice(8, 10)}`;
}

export function addDaysToDate(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);

  return value.toISOString().slice(0, 10);
}

export function todayDate() {
  return getFinanceToday();
}

export function validateCheckpointDate(value: string) {
  invariant(value <= todayDate(), "CHECKPOINT_DATE_IN_FUTURE", "Checkpoint date cannot be in the future.");
}
