import type { RecurringTransactionType, TransactionType } from "@/lib/db/schema";

/** `generated` was created by the app from the rule; `auto` and `manual` are links to a real bank, manual or card entry. */
export type RecurringOccurrenceSource = "generated" | "auto" | "manual";

export type RecurringEntryKind = "transaction" | "card";

export type RecurringOccurrenceEntry = {
  id: string;
  kind: RecurringEntryKind;
  source: RecurringOccurrenceSource;
  description: string;
  date: string;
  amountCents: number;
  accountName: string | null;
};

export type RecurringMonthOccurrence = {
  templateId: string;
  entries: RecurringOccurrenceEntry[];
  recordedCents: number;
};

/** What the page knows about recorded occurrences: entries of the shown month and every recorded `templateId:month`. */
export type RecurringOccurrencesData = {
  month: string;
  byTemplate: Record<string, RecurringMonthOccurrence>;
  recordedKeys: string[];
};

export type RecurringMatchTemplate = {
  id: string;
  type: RecurringTransactionType;
  categoryId: string;
  amountCents: number;
  dayOfMonth: number;
};

export type RecurringMatchCandidate = {
  id: string;
  kind: RecurringEntryKind;
  type: TransactionType;
  categoryId: string | null;
  categoryName: string | null;
  amountCents: number;
  date: string;
  description: string;
  accountName: string | null;
};

export type RecurringAutoLink = {
  templateId: string;
  candidate: RecurringMatchCandidate;
};

export type RecurringAutoLinkInput = {
  month: string;
  templates: RecurringMatchTemplate[];
  candidates: RecurringMatchCandidate[];
  /** `templateId:candidateId` pairs the user undid. */
  dismissed: Set<string>;
};

export type RecurringLinkCandidate = RecurringMatchCandidate & {
  isLinked: boolean;
  isSuggested: boolean;
};

export type RecurringLinkCandidatesResult = {
  generated: RecurringOccurrenceEntry[];
  candidates: RecurringLinkCandidate[];
};

export type SaveRecurringLinksInput = {
  templateId: string;
  month: string;
  transactionIds: string[];
  chargeIds: string[];
};
