import type { creditCardCharges } from "@/lib/db/schema";
import type {
  PluggyAttentionItem,
  PluggyLinkRecord,
  PluggySyncStepContext,
} from "@/lib/interfaces/pluggy";
import type { BankImportLedgerEntry, BankImportRunState } from "@/lib/interfaces/pluggy-bank-import";

export type PluggyCardRowKind = "purchase" | "refund" | "bill_payment" | "unconverted";

export type PluggyCardRow = {
  remoteId: string;
  kind: PluggyCardRowKind;
  status: "pending" | "posted";
  /** Always positive, in the currency of the account. The kind carries the direction. */
  amountCents: number;
  date: string;
  purchaseDate: string | null;
  description: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
  billId: string | null;
};

export type PluggyInvoicedCardRow = PluggyCardRow & { invoiceMonth: string; billed: boolean };

export type PluggyInstallmentObservation = { installmentNumber: number; amountCents: number };
export type PluggyInstallmentTotal = { totalCents: number; residualCents: number };

export type PluggyCardPurchase = {
  fingerprint: string;
  /** Other fingerprints this purchase may have been stored under, because its smallest installment was not always visible. */
  alternateFingerprints: string[];
  kind: "purchase" | "adjustment";
  status: "pending" | "posted";
  description: string;
  /** Negative for an adjustment. */
  totalCents: number;
  /** How many cents the real total can differ from `totalCents`. */
  residualCents: number;
  installmentCount: number;
  firstInvoiceMonth: string;
  purchaseDate: string;
  dateIsApproximate: boolean;
};

export type PluggyCardCharge = Pick<
  typeof creditCardCharges.$inferSelect,
  "id" | "kind" | "description" | "notes" | "purchaseDate" | "totalAmountCents" | "installmentCount" | "firstInvoiceMonth" | "importFingerprint"
>;

export type PluggyCardLockSubject = Pick<PluggyCardPurchase, "description" | "purchaseDate" | "totalCents">;

export type PluggyCardMatch = { fingerprint: string; entry?: BankImportLedgerEntry; charge?: PluggyCardCharge };

export type CardImportScope = {
  context: PluggySyncStepContext;
  link: PluggyLinkRecord;
  run: BankImportRunState;
  charges: Map<string, PluggyCardCharge>;
  /** Charges made only from pending records, whose remote ids may still be replaced. */
  provisional: PluggyCardCharge[];
  remoteFingerprints: Set<string>;
  claimed: Set<string>;
  seen: string[];
  counts: Record<string, number>;
  attention: PluggyAttentionItem[];
};
