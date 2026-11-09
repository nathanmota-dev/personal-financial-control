import type { pluggyImportLedger, transactions, transfers } from "@/lib/db/schema";
import type {
  PluggyAttentionItem,
  PluggyLinkRecord,
  PluggyRemoteTransaction,
  PluggySyncStepContext,
} from "@/lib/interfaces/pluggy";

export type PluggyBankClassification =
  | "ordinary"
  | "own_transfer"
  | "card_payment"
  | "investment_contribution"
  | "investment_withdrawal";

export type PluggyDirection = "DEBIT" | "CREDIT";
export type PluggyPaymentData = PluggyRemoteTransaction["paymentData"];

export type PluggyBankRow = {
  fingerprint: string;
  direction: PluggyDirection;
  type: "income" | "expense";
  status: "pending" | "posted";
  amountCents: number;
  transactionDate: string;
  competenceMonth: string;
  description: string;
  operationType: string | null;
  paymentData: PluggyPaymentData;
};

/** Names are normalized and the CPF holds digits only. */
export type PluggyOwnIdentity = { names: string[]; cpf: string | null };

export type BankImportLedgerEntry = Pick<typeof pluggyImportLedger.$inferSelect, "fingerprint" | "outcome" | "localTable" | "localId">;
export type BankImportLocalRow = typeof transactions.$inferSelect;
export type BankImportParkedTransfer = Pick<typeof transfers.$inferSelect, "id" | "fromAccountId" | "toAccountId" | "amountCents" | "transferDate">;
export type BankImportOwnLeg = { accountId: string; row: PluggyBankRow };
export type BankImportRows = { rows: PluggyBankRow[]; fingerprints: Set<string>; ignored: number };

/** Shared by every linked account of a run, so a dry run plans the same outcome as a real one. */
export type BankImportRunState = {
  identity: PluggyOwnIdentity;
  otherOwnAccountId: string | null;
  investmentCategoryId: string | null;
  links: PluggyLinkRecord[];
  ledger: Map<string, BankImportLedgerEntry>;
  parkedTransfers: BankImportParkedTransfer[];
  ownLegs: Map<string, Promise<BankImportOwnLeg[]>>;
};

export type BankImportScope = {
  context: PluggySyncStepContext;
  link: PluggyLinkRecord;
  run: BankImportRunState;
  locals: Map<string, BankImportLocalRow>;
  replaceable: BankImportLocalRow[];
  remoteFingerprints: Set<string>;
  claimed: Set<string>;
  counts: Record<string, number>;
  attention: PluggyAttentionItem[];
};

