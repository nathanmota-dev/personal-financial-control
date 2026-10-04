import type { AppDb } from "@/lib/db";
import { getFinanceDatabase } from "@/lib/db";
import type { ProjectedBalancePeriod } from "@/lib/interfaces/projected-balance";
import type {
ProjectedBalanceRequest
} from "@/lib/interfaces/projected-balance-server";
import {
projectedBalancePeriods
} from "@/lib/projected-balance";
import { DomainError,invariant } from "@/lib/server/errors";
import { normalizeDate } from "@/lib/server/finance";
import { addMonthsToMonth as addMonths } from "@/lib/utils/finance-month";
import { z } from "zod";


export const uuidSchema = z.string().uuid();

export const projectableAccountTypes = new Set<string>(["checking", "savings", "cash"]);

export async function resolveDb(database?: AppDb) {
  return database ?? getFinanceDatabase();
}

export function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, amount: number) {
  const date = parseUtcDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatUtcDate(date);
}

export function normalizeStrictDate(value: string, fieldName: string) {
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

export function getMonth(value: string) {
  return value.slice(0, 7);
}

export { addMonthsToMonth as addMonths } from "@/lib/utils/finance-month";

export function listMonths(startDate: string, endDate: string) {
  const months: string[] = [];
  let cursor = getMonth(startDate);
  const endMonth = getMonth(endDate);

  while (cursor <= endMonth) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }

  return months;
}

export function endOfMonth(date: string) {
  const [year, month] = getMonth(date).split("-").map(Number);
  return formatUtcDate(new Date(Date.UTC(year, month, 0)));
}

export function daysBetweenInclusive(startDate: string, endDate: string) {
  const start = parseUtcDate(startDate).getTime();
  const end = parseUtcDate(endDate).getTime();

  return Math.floor((end - start) / 86_400_000) + 1;
}

export function resolvePresetEndDate(
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

export function parseBooleanParam(
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

export function parseRepeatedUuid(searchParams: URLSearchParams, key: string) {
  const values = searchParams.getAll(key).filter(Boolean);
  const uniqueValues = [...new Set(values)];

  for (const value of uniqueValues) {
    if (!uuidSchema.safeParse(value).success) {
      throw new DomainError("INVALID_UUID", `${key} must contain valid UUID values.`);
    }
  }

  return uniqueValues;
}

export function validateDateRange(startDate: string, endDate: string, period: ProjectedBalancePeriod) {
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
