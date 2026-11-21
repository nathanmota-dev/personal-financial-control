import type { ReserveDestinationContribution, ReserveDestinationShortcut } from "@/lib/interfaces/reserve-destination";
import type { TransactionRow } from "@/lib/interfaces/transactions";

/** Common destinations of one contribution: all of it, half or none of it in the reserve. */
export function reserveDestinationShortcuts(amountCents: number): ReserveDestinationShortcut[] {
  return [
    { label: "Tudo reserva", cents: amountCents },
    { label: "Metade", cents: Math.floor(amountCents / 2) },
    { label: "Tudo investimentos", cents: 0 },
  ];
}

/** A bank contribution in the transaction list that still waits for its destination. */
export function pendingDestinationOf(transaction: TransactionRow): ReserveDestinationContribution | null {
  if (transaction.type !== "investment_contribution" || transaction.investmentOrigin !== "pending") return null;
  return {
    id: transaction.id,
    transactionDate: transaction.transactionDate,
    description: transaction.description,
    amountCents: transaction.amountCents,
    accountName: transaction.account?.name ?? null,
    reserveShareCents: transaction.reserveShareCents ?? null,
    pending: true,
    beforeReserve: false,
  };
}
