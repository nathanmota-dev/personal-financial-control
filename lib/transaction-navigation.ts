import type {
  TransactionMutationPayload,
  TransactionRow,
} from "@/lib/interfaces/transactions";

export function transactionSaveDestination({
  transaction,
  payload,
  afterCategorization,
}: {
  transaction?: TransactionRow;
  payload: TransactionMutationPayload;
  afterCategorization?: string;
}) {
  if (
    afterCategorization &&
    transaction?.categoryId === null &&
    payload.categoryId
  ) {
    return afterCategorization;
  }

  return null;
}
