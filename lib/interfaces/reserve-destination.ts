/** The fields of a contribution the reserve destination rule reads. */
export type ReserveDestinationRow = {
  type: string;
  status: string;
  amountCents: number;
  transactionDate: string;
  reserveShareCents: number | null;
  reserveClassifiedOn: string | null;
};

export type ClassifyReserveDestinationInput = { transactionId: string; reserveCents: number };

/** A bank contribution the reserve does not include yet: the person says how much of it went to the reserve. */
export type ReserveDestinationContribution = {
  id: string;
  transactionDate: string;
  description: string;
  amountCents: number;
  accountName: string | null;
  /** `null` while nobody classified it. */
  reserveShareCents: number | null;
  pending: boolean;
  /** Dated before the reserve was typed: it is asked because its position reached the app only afterwards. */
  beforeReserve: boolean;
};

export type ReserveDestinationShortcut = import("@/lib/interfaces/components/reserve-shortcuts").ReserveShortcut;
