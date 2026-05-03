import { DomainError } from "@/lib/server/errors";

export function parseMoneyToCents(value: number | string) {
  if (typeof value === "number") {
    invariantMoney(Number.isFinite(value), value);
    return Math.round(value * 100);
  }

  const normalized = value.replace(/\./g, "").replace(",", ".").trim();
  const parsed = Number(normalized);

  invariantMoney(Number.isFinite(parsed), value);

  return Math.round(parsed * 100);
}

function invariantMoney(condition: boolean, value: unknown) {
  if (!condition) {
    throw new DomainError("INVALID_MONEY", `Invalid monetary value: ${String(value)}`);
  }
}

export function normalizeCompetenceMonth(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw new DomainError("INVALID_COMPETENCE", "Competence month must use YYYY-MM format.");
  }

  return value;
}

export function normalizeDate(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) {
    throw new DomainError("INVALID_DATE", "Date must use YYYY-MM-DD format.");
  }

  return value;
}

export function currentTimestamp() {
  return new Date();
}

export function calculateNetBalance({
  initialBalanceCents,
  postedIncomeCents,
  postedExpenseCents,
  postedInvestmentContributionCents,
  outgoingTransferCents,
  incomingTransferCents,
}: {
  initialBalanceCents: number;
  postedIncomeCents: number;
  postedExpenseCents: number;
  postedInvestmentContributionCents: number;
  outgoingTransferCents: number;
  incomingTransferCents: number;
}) {
  return (
    initialBalanceCents +
    postedIncomeCents -
    postedExpenseCents -
    postedInvestmentContributionCents -
    outgoingTransferCents +
    incomingTransferCents
  );
}

export function serializeTimestamps<T extends { createdAt?: Date; updatedAt?: Date }>(record: T) {
  return {
    ...record,
    createdAt: record.createdAt?.toISOString(),
    updatedAt: record.updatedAt?.toISOString(),
  };
}
