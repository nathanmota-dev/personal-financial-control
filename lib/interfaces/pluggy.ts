import type { z } from "zod";

import type { AppDb } from "@/lib/db";
import type { pluggyAccountKinds, pluggySyncRunStatuses } from "@/lib/db/schema/enums";
import type {
  pluggyAccountSchema,
  pluggyBillSchema,
  pluggyInvestmentSchema,
  pluggyItemSchema,
  pluggyTransactionSchema,
} from "@/lib/server/pluggy/schemas";

export type PluggyRemoteItem = z.infer<typeof pluggyItemSchema>;
export type PluggyRemoteAccount = z.infer<typeof pluggyAccountSchema>;
export type PluggyRemoteTransaction = z.infer<typeof pluggyTransactionSchema>;
export type PluggyRemoteBill = z.infer<typeof pluggyBillSchema>;
export type PluggyRemoteInvestment = z.infer<typeof pluggyInvestmentSchema>;

export type PluggyCredentials = { clientId: string; clientSecret: string };
export type PluggyTransactionFilter = { from?: string; to?: string };

export type PluggyApi = {
  getItem(itemId: string): Promise<PluggyRemoteItem>;
  listAccounts(itemId: string): Promise<PluggyRemoteAccount[]>;
  listTransactions(accountId: string, filter?: PluggyTransactionFilter): Promise<PluggyRemoteTransaction[]>;
  listBills(accountId: string): Promise<PluggyRemoteBill[]>;
  listInvestments(itemId: string): Promise<PluggyRemoteInvestment[]>;
};

export type PluggyRuntime = { client?: PluggyApi; syncRunning: boolean };
export type PluggyRuntimeGlobal = typeof globalThis & { __pfcPluggy?: PluggyRuntime };

export type PluggyAccountKind = (typeof pluggyAccountKinds)[number];
export type PluggySyncRunStatus = (typeof pluggySyncRunStatuses)[number];

export type PluggyRemoteAccountView = {
  externalAccountId: string;
  name: string;
  kind: PluggyAccountKind;
  numberSuffix: string | null;
};

export type PluggyItemView = {
  id: string;
  label: string;
  connectorName: string;
  status: string;
  collectedAt: string | null;
  nextAutoSyncAt: string | null;
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  remoteAccounts: PluggyRemoteAccountView[];
  accountsError: string | null;
};

export type PluggyLinkView = {
  id: string;
  itemId: string;
  externalAccountId: string;
  accountId: string;
  remoteName: string;
  kind: PluggyAccountKind;
  cutoffDate: string;
  isEnabled: boolean;
};

export type PluggySyncFailure = {
  scope: "item" | "account";
  step: string;
  targetId: string;
  label: string;
  code: string;
  message: string;
};

export type PluggyAttentionReason =
  | "possible_own_transfer"
  | "missing_other_own_account"
  | "missing_investment_category"
  | "card_total_residual"
  | "card_locked_by_paid_bill"
  | "card_missing_account_currency"
  | "card_bill_non_positive"
  | "card_bill_paid_changed"
  | "card_payment_unlinked"
  | "card_payment_ambiguous"
  | "card_payment_outside_links";

export type PluggyAttentionItem = {
  reason: PluggyAttentionReason;
  accountLabel: string;
  description: string;
  date: string;
  amountCents: number;
};

export type PluggyInvoiceReconciliationStatus = "matched" | "difference" | "unlinked_payment";

export type PluggyInvoiceReconciliation = {
  accountLabel: string;
  invoiceMonth: string;
  statementTotalCents: number;
  importedCents: number;
  /** Positive when the statement is higher than the imported records explain. */
  differenceCents: number;
  unlinkedPaymentCents: number;
  status: PluggyInvoiceReconciliationStatus;
};

export type PluggySyncSummary = {
  dryRun: boolean;
  items: { total: number; failed: number };
  accounts: { total: number; failed: number; skipped: number };
  counts: Record<string, number>;
  failures: PluggySyncFailure[];
  /** Absent on runs stored before bank imports existed. */
  attention?: PluggyAttentionItem[];
  /** Absent on runs stored before bills were imported, and on dry runs. */
  invoices?: PluggyInvoiceReconciliation[];
};

export type PluggySyncRunView = {
  id: string | null;
  startedAt: string;
  finishedAt: string | null;
  status: PluggySyncRunStatus;
  errorCode: string | null;
  summary: PluggySyncSummary | null;
};

export type PluggyItemRecord = {
  id: string;
  externalItemId: string;
  label: string;
};

export type PluggyLinkRecord = {
  id: string;
  itemId: string;
  externalAccountId: string;
  accountId: string;
  remoteName: string;
  kind: PluggyAccountKind;
  cutoffDate: string;
};

export type PluggySyncStepResult = { counts?: Record<string, number>; attention?: PluggyAttentionItem[]; invoices?: PluggyInvoiceReconciliation[] } | void;

export type PluggySyncStepContext = {
  /** Reads only. Every mutation must go through `write`, which a dry run skips. */
  db: AppDb;
  client: PluggyApi;
  dryRun: boolean;
  now: Date;
  write(mutation: (db: AppDb) => Promise<unknown>): Promise<void>;
  remoteAccounts(item: PluggyItemRecord): Promise<PluggyRemoteAccount[]>;
  /** Cached per run, because pairing an own transfer also reads the other linked accounts. */
  remoteTransactions(link: PluggyLinkRecord): Promise<PluggyRemoteTransaction[]>;
  remoteBills(link: PluggyLinkRecord): Promise<PluggyRemoteBill[]>;
};

export type PluggyItemSyncStep = {
  name: string;
  scope: "item";
  run(context: PluggySyncStepContext, item: PluggyItemRecord): Promise<PluggySyncStepResult>;
};

export type PluggyAccountSyncStep = {
  name: string;
  scope: "account";
  run(context: PluggySyncStepContext, link: PluggyLinkRecord, item: PluggyItemRecord): Promise<PluggySyncStepResult>;
};

export type PluggySyncStep = PluggyItemSyncStep | PluggyAccountSyncStep;

export type PluggySyncOptions = {
  db: AppDb;
  client: PluggyApi;
  dryRun?: boolean;
  steps?: readonly PluggySyncStep[];
};

export type PluggyOverview = {
  items: PluggyItemView[];
  links: PluggyLinkView[];
};

/** The CPF is never sent back in full. */
export type PluggyIdentityView = { names: string[]; cpfMasked: string | null; otherOwnAccountId: string | null };
export type PluggyIdentityDraft = { names: string[]; cpf?: string; otherOwnAccountId: string | null };

export type PluggyLatestRun = { run: PluggySyncRunView | null; running: boolean };

export type PluggyAccountRow = {
  externalAccountId: string;
  name: string;
  kind: PluggyAccountKind;
  numberSuffix: string | null;
  link: PluggyLinkView | null;
};

export type PluggyApiErrorBody = { error?: { message?: string } | string };
export type PluggyLinkDraft = { accountId: string; cutoffDate: string; isEnabled: boolean };
