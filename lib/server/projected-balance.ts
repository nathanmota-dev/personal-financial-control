import { and, eq, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";
import { z } from "zod";

import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import {
  recurringTemplates,
  transactions,
  transfers,
} from "@/lib/db/schema";
import {
  calculateDailyProjection,
  projectedBalancePeriods,
} from "@/lib/projected-balance";
import type { ProjectionEvent, ProjectedBalancePeriod } from "@/lib/interfaces/projected-balance";
import type {
  ProjectedBalanceAccountRow,
  ProjectedBalanceRecurringTemplateRow,
  ProjectedBalanceRequest,
  ProjectedBalanceResult,
  ProjectedBalanceTransactionRow,
  ProjectedBalanceTransferRow,
} from "@/lib/interfaces/projected-balance-server";
import { listCreditCardExpenseEntries } from "@/lib/server/credit-card";
import { DomainError, invariant } from "@/lib/server/errors";
import { normalizeDate } from "@/lib/server/finance";

const uuidSchema = z.string().uuid();
const projectableAccountTypes = new Set<string>(["checking", "savings", "cash"]);

async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number) {
  const date = parseUtcDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatUtcDate(date);
}

function normalizeStrictDate(value: string, fieldName: string) {
  try {
    normalizeDate(value);
  } catch {
    throw new DomainError(
      "INVALID_DATE",
      `${fieldName} must use YYYY-MM-DD format.`
    );
  }

  if (formatUtcDate(parseUtcDate(value)) !== value) {
    throw new DomainError("INVALID_DATE", `${fieldName} must be a valid calendar date.`);
  }

  return value;
}

function getMonth(value: string) {
  return value.slice(0, 7);
}

function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function listMonths(startDate: string, endDate: string) {
  const months: string[] = [];
  let cursor = getMonth(startDate);
  const endMonth = getMonth(endDate);

  while (cursor <= endMonth) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  return months;
}

function endOfMonth(date: string) {
  const [year, month] = getMonth(date).split("-").map(Number);
  return formatUtcDate(new Date(Date.UTC(year, month, 0)));
}

function daysBetweenInclusive(startDate: string, endDate: string) {
  const start = parseUtcDate(startDate).getTime();
  const end = parseUtcDate(endDate).getTime();

  return Math.floor((end - start) / 86_400_000) + 1;
}

function buildDateInMonth(month: string, dayOfMonth: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const clampedDay = Math.min(dayOfMonth, lastDay);

  return `${month}-${String(clampedDay).padStart(2, "0")}`;
}

function resolvePresetEndDate(
  period: ProjectedBalancePeriod,
  startDate: string,
  customEndDate?: string
) {
  if (period === "custom") {
    invariant(customEndDate, "END_DATE_REQUIRED", "endDate is required for custom period.");
    return customEndDate;
  }

  if (period === "end_of_month") {
    return endOfMonth(startDate);
  }

  if (period === "next_30_days") {
    return addDays(startDate, 29);
  }

  if (period === "next_60_days") {
    return addDays(startDate, 59);
  }

  if (period === "next_90_days") {
    return addDays(startDate, 89);
  }

  return undefined;
}

function parseBooleanParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: boolean
) {
  const rawValue = searchParams.get(key);

  if (rawValue === null) {
    return defaultValue;
  }

  if (["true", "1", "yes"].includes(rawValue)) {
    return true;
  }

  if (["false", "0", "no"].includes(rawValue)) {
    return false;
  }

  throw new DomainError("INVALID_BOOLEAN", `${key} must be a boolean value.`);
}

function parseRepeatedUuid(searchParams: URLSearchParams, key: string) {
  const values = searchParams.getAll(key).filter(Boolean);
  const uniqueValues = [...new Set(values)];

  for (const value of uniqueValues) {
    if (!uuidSchema.safeParse(value).success) {
      throw new DomainError("INVALID_UUID", `${key} must contain valid UUID values.`);
    }
  }

  return uniqueValues;
}

function validateDateRange(startDate: string, endDate: string, period: ProjectedBalancePeriod) {
  invariant(
    startDate <= endDate,
    "INVALID_DATE_RANGE",
    "startDate must be before or equal to endDate."
  );

  if (period === "custom") {
    invariant(
      daysBetweenInclusive(startDate, endDate) <= 366,
      "DATE_RANGE_TOO_LONG",
      "custom period cannot be longer than 366 days."
    );
  }
}

export function parseProjectedBalanceSearchParams(
  searchParams: URLSearchParams,
  now = new Date()
): ProjectedBalanceRequest {
  const rawPeriod = searchParams.get("period") ?? "next_income";
  const period = z.enum(projectedBalancePeriods).parse(rawPeriod);
  const startDate = normalizeStrictDate(
    searchParams.get("startDate") ?? formatLocalDate(now),
    "startDate"
  );
  const customEndDate = searchParams.get("endDate")
    ? normalizeStrictDate(searchParams.get("endDate") as string, "endDate")
    : undefined;
  const endDate = resolvePresetEndDate(period, startDate, customEndDate);
  const minimumReserveCents = Number(searchParams.get("minimumReserveCents") ?? 0);

  invariant(
    Number.isInteger(minimumReserveCents) && minimumReserveCents >= 0,
    "INVALID_MINIMUM_RESERVE",
    "minimumReserveCents must be a non-negative integer."
  );

  if (endDate) {
    validateDateRange(startDate, endDate, period);
  }

  return {
    period,
    startDate,
    endDate,
    accountIds: parseRepeatedUuid(searchParams, "accountId"),
    creditAccountIds: parseRepeatedUuid(searchParams, "creditAccountId"),
    minimumReserveCents,
    includeCreditCard: parseBooleanParam(searchParams, "includeCreditCard", true),
    includeInvestments: parseBooleanParam(searchParams, "includeInvestments", true),
    includeTransfers: parseBooleanParam(searchParams, "includeTransfers", true),
  };
}

function ensureProjectableAccount(
  account: ProjectedBalanceAccountRow,
  requestedId?: string
) {
  invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Account is archived.");
  invariant(
    projectableAccountTypes.has(account.type),
    "ACCOUNT_TYPE_NOT_PROJECTABLE",
    requestedId
      ? "accountId must reference a checking, savings, or cash account."
      : "Only checking, savings, and cash accounts are included in projections."
  );
}

function accountIdSet(accountsToProject: ProjectedBalanceAccountRow[]) {
  return new Set(accountsToProject.map((account) => account.id));
}

async function resolveProjectionAccounts(
  db: AppDb,
  requestedAccountIds: string[],
  requestedCreditAccountIds: string[]
) {
  const allAccounts = await db.query.accounts.findMany();
  const accountsById = new Map(allAccounts.map((account) => [account.id, account]));

  const selectedAccounts = requestedAccountIds.length
    ? requestedAccountIds.map((id) => {
        const account = accountsById.get(id);
        invariant(account, "ACCOUNT_NOT_FOUND", "Projection account does not exist.", 404);
        ensureProjectableAccount(account, id);
        return account;
      })
    : allAccounts.filter(
        (account) =>
          !account.isArchived && projectableAccountTypes.has(account.type)
      );

  const selectedCreditAccounts = requestedCreditAccountIds.length
    ? requestedCreditAccountIds.map((id) => {
        const account = accountsById.get(id);
        invariant(account, "ACCOUNT_NOT_FOUND", "Credit card account does not exist.", 404);
        invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Credit card account is archived.");
        invariant(
          account.type === "credit",
          "ACCOUNT_TYPE_NOT_CREDIT",
          "creditAccountId must reference a credit account."
        );
        return account;
      })
    : requestedAccountIds.length
      ? []
      : allAccounts.filter((account) => !account.isArchived && account.type === "credit");

  return {
    selectedAccounts,
    selectedCreditAccounts,
  };
}

async function calculateInitialBalance(
  db: AppDb,
  startDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[]
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return 0;
  }

  const [transactionRows, transferRows] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        inArray(transactions.accountId, ids),
        eq(transactions.status, "posted"),
        lt(transactions.transactionDate, startDate)
      ),
    }),
    db.query.transfers.findMany({
      where: and(
        lt(transfers.transferDate, startDate),
        or(inArray(transfers.fromAccountId, ids), inArray(transfers.toAccountId, ids))
      ),
    }),
  ]);
  const selectedAccountIds = accountIdSet(selectedAccounts);
  const initialBalancesCents = selectedAccounts.reduce(
    (total, account) => total + account.initialBalanceCents,
    0
  );
  const transactionImpactCents = transactionRows.reduce((total, transaction) => {
    if (transaction.type === "income") {
      return total + transaction.amountCents;
    }

    if (transaction.type === "investment_withdrawal") {
      return total + transaction.amountCents;
    }

    return total - transaction.amountCents;
  }, 0);
  const transferImpactCents = transferRows.reduce((total, transfer) => {
    const fromIncluded = selectedAccountIds.has(transfer.fromAccountId);
    const toIncluded = selectedAccountIds.has(transfer.toAccountId);

    if (fromIncluded && toIncluded) {
      return total;
    }

    if (fromIncluded) {
      return total - transfer.amountCents;
    }

    if (toIncluded) {
      return total + transfer.amountCents;
    }

    return total;
  }, 0);

  return initialBalancesCents + transactionImpactCents + transferImpactCents;
}

function mapTransactionToEvent(
  transaction: ProjectedBalanceTransactionRow
): ProjectionEvent | null {
  if (transaction.account?.type === "credit") {
    return null;
  }

  if (transaction.type === "income") {
    return {
      id: transaction.id,
      source: "transaction",
      type: "income",
      description: transaction.description,
      amountCents: transaction.amountCents,
      netImpactCents: transaction.amountCents,
      date: transaction.transactionDate,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      metadata: {
        status: transaction.status,
        competenceMonth: transaction.competenceMonth,
        accountName: transaction.account?.name ?? null,
        categoryName: transaction.category?.name ?? null,
      },
    };
  }

  if (transaction.type === "investment_contribution") {
    return {
      id: transaction.id,
      source: "investment",
      type: "investment",
      description: transaction.description,
      amountCents: transaction.amountCents,
      netImpactCents: -transaction.amountCents,
      date: transaction.transactionDate,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      metadata: {
        status: transaction.status,
        direction: "contribution",
        competenceMonth: transaction.competenceMonth,
        accountName: transaction.account?.name ?? null,
        categoryName: transaction.category?.name ?? null,
      },
    };
  }

  if (transaction.type === "investment_withdrawal") {
    return {
      id: transaction.id,
      source: "investment",
      type: "investment",
      description: transaction.description,
      amountCents: transaction.amountCents,
      netImpactCents: transaction.amountCents,
      date: transaction.transactionDate,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      metadata: {
        status: transaction.status,
        direction: "withdrawal",
        competenceMonth: transaction.competenceMonth,
        accountName: transaction.account?.name ?? null,
        categoryName: transaction.category?.name ?? null,
      },
    };
  }

  return {
    id: transaction.id,
    source: "transaction",
    type: "expense",
    description: transaction.description,
    amountCents: transaction.amountCents,
    netImpactCents: -transaction.amountCents,
    date: transaction.transactionDate,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    metadata: {
      status: transaction.status,
      competenceMonth: transaction.competenceMonth,
      accountName: transaction.account?.name ?? null,
      categoryName: transaction.category?.name ?? null,
    },
  };
}

async function listTransactionEvents(
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

  const rows = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.accountId, ids),
      inArray(transactions.status, ["pending", "posted"]),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate)
    ),
    with: {
      account: true,
      category: true,
    },
  });

  return rows
    .filter(
      (row) =>
        includeInvestments ||
        (row.type !== "investment_contribution" && row.type !== "investment_withdrawal")
    )
    .map((row) => mapTransactionToEvent(row))
    .filter((event): event is ProjectionEvent => Boolean(event));
}

async function listExistingRecurringOccurrences(
  db: AppDb,
  startMonth: string,
  endMonth: string,
  templateIds: string[]
) {
  if (!templateIds.length) {
    return new Set<string>();
  }

  const rows = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.recurringTemplateId, templateIds),
      gte(transactions.competenceMonth, startMonth),
      lte(transactions.competenceMonth, endMonth)
    ),
  });

  return new Set(rows.map((row) => `${row.recurringTemplateId}:${row.competenceMonth}`));
}

function recurringTypeToEventType(type: string) {
  if (type === "income") {
    return "income" as const;
  }

  if (type === "investment_contribution") {
    return "investment" as const;
  }

  return "expense" as const;
}

function recurringNetImpactCents(type: string, amountCents: number) {
  return type === "income" ? amountCents : -amountCents;
}

async function listRecurringEvents(
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

async function listCreditCardEvents(
  db: AppDb,
  startDate: string,
  endDate: string,
  selectedCreditAccounts: ProjectedBalanceAccountRow[]
) {
  if (!selectedCreditAccounts.length) {
    return [];
  }

  const creditAccountIds = new Set(selectedCreditAccounts.map((account) => account.id));
  const creditAccountsById = new Map(
    selectedCreditAccounts.map((account) => [account.id, account])
  );
  const events: ProjectionEvent[] = [];

  for (const month of listMonths(startDate, endDate)) {
    const invoiceEntries = await listCreditCardExpenseEntries(month, db);
    const totalsByAccountId = new Map<string, { amountCents: number; entryCount: number }>();

    for (const entry of invoiceEntries) {
      if (!entry.account?.id || !creditAccountIds.has(entry.account.id)) {
        continue;
      }

      const current = totalsByAccountId.get(entry.account.id) ?? {
        amountCents: 0,
        entryCount: 0,
      };
      current.amountCents += entry.amountCents;
      current.entryCount += 1;
      totalsByAccountId.set(entry.account.id, current);
    }

    for (const [accountId, total] of totalsByAccountId) {
      const account = creditAccountsById.get(accountId);

      if (!account) {
        continue;
      }

      const dueDate = buildDateInMonth(month, account.creditDueDay);

      if (dueDate < startDate || dueDate > endDate) {
        continue;
      }

      events.push({
        id: `credit-card:${accountId}:${month}`,
        source: "credit_card",
        type: "credit_card",
        description: `Fatura ${account.name} ${month}`,
        amountCents: total.amountCents,
        netImpactCents: -total.amountCents,
        date: dueDate,
        accountId,
        metadata: {
          accountName: account.name,
          invoiceMonth: month,
          dueDay: account.creditDueDay,
          entryCount: total.entryCount,
        },
      });
    }
  }

  return events;
}

async function listTransferEvents(
  db: AppDb,
  startDate: string,
  endDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[]
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return [];
  }

  const selectedAccountIds = accountIdSet(selectedAccounts);
  const rows = await db.query.transfers.findMany({
    where: and(
      or(inArray(transfers.fromAccountId, ids), inArray(transfers.toAccountId, ids)),
      gte(transfers.transferDate, startDate),
      lte(transfers.transferDate, endDate)
    ),
    with: {
      fromAccount: true,
      toAccount: true,
    },
  });
  const events: ProjectionEvent[] = [];

  for (const transfer of rows as ProjectedBalanceTransferRow[]) {
    const fromIncluded = selectedAccountIds.has(transfer.fromAccountId);
    const toIncluded = selectedAccountIds.has(transfer.toAccountId);

    if (fromIncluded === toIncluded) {
      continue;
    }

    const isIncoming = toIncluded;

    events.push({
      id: transfer.id,
      source: "transfer",
      type: "transfer",
      description: transfer.description,
      amountCents: transfer.amountCents,
      netImpactCents: isIncoming ? transfer.amountCents : -transfer.amountCents,
      date: transfer.transferDate,
      accountId: isIncoming ? transfer.toAccountId : transfer.fromAccountId,
      metadata: {
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        fromAccountName: transfer.fromAccount?.name ?? null,
        toAccountName: transfer.toAccount?.name ?? null,
        competenceMonth: transfer.competenceMonth,
      },
    });
  }

  return events;
}

async function findNextTransactionIncomeDate(
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

async function findNextRecurringIncomeDate(
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

async function resolveEndDate(
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
