import type { AppDb } from "@/lib/db";
import {
recurringTemplates
} from "@/lib/db/schema";
import type { ProjectionEvent } from "@/lib/interfaces/projected-balance";
import type {
ProjectedBalanceAccountRow,
ProjectedBalanceRecurringTemplateRow
} from "@/lib/interfaces/projected-balance-server";
import { buildDateInMonth } from "@/lib/utils/finance-month";
import { and,eq,gte,inArray,isNull,lte,or } from "drizzle-orm";
import { getMonth,listMonths } from "./filters";
import { listExistingRecurringOccurrences } from "./transactions";

export function recurringTypeToEventType(type: string) {
  if (type === "income") {
    return "income" as const;
  }

  if (type === "investment_contribution") {
    return "investment" as const;
  }

  return "expense" as const;
}

export function recurringNetImpactCents(type: string, amountCents: number) {
  return type === "income" ? amountCents : -amountCents;
}

export async function listRecurringEvents(
  db: AppDb,
  startDate: string,
  endDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[],
  includeInvestments: boolean
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return [];
  }

  const startMonth = getMonth(startDate);
  const endMonth = getMonth(endDate);
  const rows = await db.query.recurringTemplates.findMany({
    where: and(
      inArray(recurringTemplates.accountId, ids),
      eq(recurringTemplates.status, "active"),
      lte(recurringTemplates.startMonth, endMonth),
      or(isNull(recurringTemplates.endMonth), gte(recurringTemplates.endMonth, startMonth))
    ),
    with: {
      account: true,
      category: true,
    },
  });
  const existingOccurrences = await listExistingRecurringOccurrences(
    db,
    startMonth,
    endMonth,
    rows.map((row) => row.id)
  );
  const months = listMonths(startDate, endDate);
  const events: ProjectionEvent[] = [];

  for (const row of rows as ProjectedBalanceRecurringTemplateRow[]) {
    if (!includeInvestments && row.type === "investment_contribution") {
      continue;
    }

    for (const month of months) {
      if (month < row.startMonth || (row.endMonth && month > row.endMonth)) {
        continue;
      }

      if (existingOccurrences.has(`${row.id}:${month}`)) {
        continue;
      }

      const date = buildDateInMonth(month, row.dayOfMonth);

      if (date < startDate || date > endDate) {
        continue;
      }

      events.push({
        id: `${row.id}:${month}`,
        source: "recurring",
        type: recurringTypeToEventType(row.type),
        description: row.description,
        amountCents: row.amountCents,
        netImpactCents: recurringNetImpactCents(row.type, row.amountCents),
        date,
        accountId: row.accountId,
        categoryId: row.categoryId,
        metadata: {
          templateId: row.id,
          direction: "contribution",
          competenceMonth: month,
          accountName: row.account?.name ?? null,
          categoryName: row.category?.name ?? null,
        },
      });
    }
  }

  return events;
}
