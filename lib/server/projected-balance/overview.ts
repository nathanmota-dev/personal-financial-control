import type { AppDb } from "@/lib/db";
import {
transactions
} from "@/lib/db/schema";
import type {
ProjectedBalanceAccountRow,
ProjectedBalanceRequest,
ProjectedBalanceResult
} from "@/lib/interfaces/projected-balance-server";
import {
calculateDailyProjection
} from "@/lib/projected-balance";
import { and,eq,gte,inArray } from "drizzle-orm";
import { calculateInitialBalance,resolveProjectionAccounts } from "./accounts";
import { listCreditCardEvents,listTransferEvents } from "./commitments";
import { addDays,endOfMonth,resolveDb,validateDateRange } from "./filters";
import { listRecurringEvents } from "./recurring";
import { listTransactionEvents } from "./transactions";

export async function findNextTransactionIncomeDate(
  db: AppDb,
  startDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[]
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return null;
  }

  const row = await db.query.transactions.findFirst({
    where: and(
      inArray(transactions.accountId, ids),
      eq(transactions.type, "income"),
      inArray(transactions.status, ["pending", "posted"]),
      gte(transactions.transactionDate, startDate)
    ),
    orderBy: (table, { asc }) => [asc(table.transactionDate)],
  });

  return row?.transactionDate ?? null;
}

export async function findNextRecurringIncomeDate(
  db: AppDb,
  startDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[]
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return null;
  }

  const searchEndDate = addDays(startDate, 365);
  const recurringEvents = await listRecurringEvents(
    db,
    startDate,
    searchEndDate,
    selectedAccounts,
    true
  );

  return (
    recurringEvents
      .filter((event) => event.type === "income")
      .sort((left, right) => left.date.localeCompare(right.date))[0]?.date ?? null
  );
}

export async function resolveEndDate(
  db: AppDb,
  request: ProjectedBalanceRequest,
  selectedAccounts: ProjectedBalanceAccountRow[]
) {
  if (request.endDate) {
    return request.endDate;
  }

  const [transactionIncomeDate, recurringIncomeDate] = await Promise.all([
    findNextTransactionIncomeDate(db, request.startDate, selectedAccounts),
    findNextRecurringIncomeDate(db, request.startDate, selectedAccounts),
  ]);
  const candidates = [transactionIncomeDate, recurringIncomeDate].filter(
    (date): date is string => Boolean(date)
  );

  return candidates.sort()[0] ?? endOfMonth(request.startDate);
}

export async function getProjectedBalance(
  request: ProjectedBalanceRequest,
  database?: AppDb
): Promise<ProjectedBalanceResult> {
  const db = await resolveDb(database);
  const { selectedAccounts, selectedCreditAccounts } = await resolveProjectionAccounts(
    db,
    request.accountIds,
    request.creditAccountIds
  );
  const endDate = await resolveEndDate(db, request, selectedAccounts);

  validateDateRange(request.startDate, endDate, request.period);

  const [initialBalanceCents, transactionEvents, recurringEvents, transferEvents, creditCardEvents] =
    await Promise.all([
      calculateInitialBalance(db, request.startDate, selectedAccounts),
      listTransactionEvents(
        db,
        request.startDate,
        endDate,
        selectedAccounts,
        request.includeInvestments
      ),
      listRecurringEvents(
        db,
        request.startDate,
        endDate,
        selectedAccounts,
        request.includeInvestments
      ),
      request.includeTransfers
        ? listTransferEvents(db, request.startDate, endDate, selectedAccounts)
        : Promise.resolve([]),
      request.includeCreditCard
        ? listCreditCardEvents(db, request.startDate, endDate, selectedCreditAccounts)
        : Promise.resolve([]),
    ]);
  const projection = calculateDailyProjection({
    startDate: request.startDate,
    endDate,
    initialBalanceCents,
    minimumReserveCents: request.minimumReserveCents,
    events: [
      ...transactionEvents,
      ...recurringEvents,
      ...transferEvents,
      ...creditCardEvents,
    ],
  });

  return {
    filters: {
      period: request.period,
      startDate: request.startDate,
      endDate,
      accountIds: selectedAccounts.map((account) => account.id),
      creditAccountIds: selectedCreditAccounts.map((account) => account.id),
      minimumReserveCents: request.minimumReserveCents,
      includeCreditCard: request.includeCreditCard,
      includeInvestments: request.includeInvestments,
      includeTransfers: request.includeTransfers,
    },
    ...projection,
  };
}
