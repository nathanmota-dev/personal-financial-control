import type {
  TransactionMutationPayload,
  TransactionRow,
} from "@/lib/interfaces/transactions";

function isInvestmentReduction(
  transaction: Pick<TransactionMutationPayload, "type" | "fundingSource">
) {
  return (
    (transaction.type === "expense" && transaction.fundingSource === "investments") ||
    transaction.type === "investment_withdrawal"
  );
}

function isEffectiveReduction(
  transaction: Pick<
    TransactionMutationPayload,
    "type" | "fundingSource" | "status" | "transactionDate"
  >,
  today: string
) {
  return (
    isInvestmentReduction(transaction) &&
    transaction.status === "posted" &&
    transaction.transactionDate <= today
  );
}

export function needsInvestmentReductionConfirmation(
  payload: TransactionMutationPayload,
  existing: TransactionRow | undefined,
  today: string
) {
  if (!isEffectiveReduction(payload, today)) {
    return false;
  }

  if (!existing) {
    return true;
  }

  const existingHasRecordedReduction =
    isEffectiveReduction(existing, today) &&
    (existing.type === "investment_withdrawal" || Boolean(existing.fundingLink));

  if (!existingHasRecordedReduction) {
    return true;
  }

  return (
    !isInvestmentReduction(existing) ||
    payload.type !== existing.type ||
    payload.amountCents !== existing.amountCents
  );
}
