import { createHash } from "node:crypto";

import type { PluggyCardPurchase, PluggyCardRow, PluggyInstallmentPlanEntry, PluggyInvoicedCardRow } from "@/lib/interfaces/pluggy-card-import";
import { resolveFirstInvoiceMonth, shiftMonth, splitInstallmentAmounts } from "@/lib/server/credit-card/validation";
import { rebuildInstallmentTotal } from "./card-installment-total";
import { normalizeDescription } from "./normalize-description";

type InstallmentRow = PluggyInvoicedCardRow & { installmentNumber: number; totalInstallments: number };
type GroupOptions = { accountId: string; closingDay: number };
type PurchaseKey = { normalized: string; count: number; firstInvoiceMonth: string };

const FINGERPRINT_PREFIX = "pluggy:card:";
const MAX_FINGERPRINT_LENGTH = 255;

export const APPROXIMATE_DATE_NOTE = "Data aproximada: a parcela 1 não estava disponível na importação.";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function singlePaymentFingerprint(remoteId: string) {
  const fingerprint = `${FINGERPRINT_PREFIX}${remoteId}`;
  return fingerprint.length <= MAX_FINGERPRINT_LENGTH ? fingerprint : `${FINGERPRINT_PREFIX}${sha256(remoteId)}`;
}

export function installmentFingerprint(accountId: string, key: PurchaseKey, amountCents: number, occurrence: number) {
  return `${FINGERPRINT_PREFIX}${sha256([accountId, key.normalized, amountCents, key.count, key.firstInvoiceMonth, occurrence].join("|"))}`;
}

function estimatedInvoiceMonth(row: PluggyCardRow, closingDay: number) {
  if (row.purchaseDate && row.installmentNumber) return shiftMonth(resolveFirstInvoiceMonth(row.purchaseDate, closingDay), row.installmentNumber - 1);
  return resolveFirstInvoiceMonth(row.date, closingDay);
}

/** A bill states the month. Without one, as on pending records, the card's closing day estimates it. */
export function assignInvoiceMonths(rows: PluggyCardRow[], billMonths: ReadonlyMap<string, string>, closingDay: number): PluggyInvoicedCardRow[] {
  return rows.map((row) => {
    const billMonth = row.billId ? billMonths.get(row.billId) : undefined;
    return { ...row, invoiceMonth: billMonth ?? estimatedInvoiceMonth(row, closingDay), billed: Boolean(billMonth) };
  });
}

const isInstallment = (row: PluggyInvoicedCardRow): row is InstallmentRow => row.kind === "purchase" && row.installmentNumber !== null && row.totalInstallments !== null;

const firstInvoiceOf = (row: InstallmentRow) => shiftMonth(row.invoiceMonth, 1 - row.installmentNumber);

const purchaseIdentity = (row: InstallmentRow) => `${normalizeDescription(row.description)}|${row.totalInstallments}|${row.purchaseDate}`;

/** The closing day is only an estimate, so an unbilled installment follows its billed siblings from the same purchase date. */
function firstInvoiceResolver(rows: InstallmentRow[]) {
  // Highest number first, so the lowest billed installment wins: an anticipated one sits in an earlier invoice than its number implies.
  const billed = rows.filter((row) => row.billed && row.purchaseDate).sort((left, right) => right.installmentNumber - left.installmentNumber);
  const billedMonths = new Map(billed.map((row) => [purchaseIdentity(row), firstInvoiceOf(row)]));
  return (row: InstallmentRow) => (row.purchaseDate ? billedMonths.get(purchaseIdentity(row)) : undefined) ?? firstInvoiceOf(row);
}

function groupBy<T>(rows: T[], keyOf: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  return [...groups.values()];
}

/** A bank may place the whole remainder on the first installment, so one purchase can spread by up to one cent per other installment. */
const maxInstallmentSpread = (count: number) => Math.max(1, count - 1);

function splitByAmount(rows: InstallmentRow[]) {
  const buckets: InstallmentRow[][] = [];
  for (const row of [...rows].sort((left, right) => left.amountCents - right.amountCents)) {
    const bucket = buckets.at(-1);
    if (bucket && row.amountCents - bucket[0].amountCents <= maxInstallmentSpread(row.totalInstallments)) bucket.push(row);
    else buckets.push([row]);
  }
  return buckets;
}

/** Repeating an installment number means another identical purchase, kept apart by the order of arrival. */
function splitOccurrences(rows: InstallmentRow[]) {
  const occurrences: InstallmentRow[][] = [];
  const seen = new Map<number, number>();
  for (const row of [...rows].sort((left, right) => left.date.localeCompare(right.date) || left.remoteId.localeCompare(right.remoteId))) {
    const index = seen.get(row.installmentNumber) ?? 0;
    (occurrences[index] ??= []).push(row);
    seen.set(row.installmentNumber, index + 1);
  }
  return occurrences;
}

function closingDateOf(month: string, closingDay: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(Math.min(closingDay, lastDay)).padStart(2, "0")}`;
}

/** Banks may date later installments by posting, so only a stated purchase date or installment 1 is exact. */
function purchaseDateOf(rows: InstallmentRow[], firstInvoiceMonth: string, closingDay: number) {
  const exact = rows.find((row) => row.purchaseDate)?.purchaseDate ?? rows.find((row) => row.installmentNumber === 1)?.date;
  return { purchaseDate: exact ?? closingDateOf(firstInvoiceMonth, closingDay), dateIsApproximate: !exact };
}

function withoutInstallmentMarker({ description, installmentNumber, totalInstallments }: InstallmentRow) {
  const marker = new RegExp(`\\s*(?:PARC(?:ELA)?\\.?\\s*)?0*${installmentNumber}\\s*(?:/|DE)\\s*0*${totalInstallments}\\s*$`, "i");
  return description.replace(marker, "").trim() || description;
}

/** What the bank states wins: the observed amount and billed month of each installment. The rest follow the monthly schedule. */
function installmentPlan(sorted: InstallmentRow[], key: PurchaseKey, totalCents: number): PluggyInstallmentPlanEntry[] {
  const observed = new Map(sorted.map((row) => [row.installmentNumber, row]));
  const remaining = totalCents - sorted.reduce((sum, row) => sum + row.amountCents, 0);
  const unseen = splitInstallmentAmounts(remaining, Math.max(1, key.count - sorted.length));
  return Array.from({ length: key.count }, (_, index) => {
    const row = observed.get(index + 1);
    const scheduled = shiftMonth(key.firstInvoiceMonth, index);
    return row ? { amountCents: row.amountCents, invoiceMonth: row.billed ? row.invoiceMonth : scheduled } : { amountCents: unseen.shift()!, invoiceMonth: scheduled };
  });
}

function installmentPurchase(rows: InstallmentRow[], key: PurchaseKey, smallest: number, occurrence: number, options: GroupOptions): PluggyCardPurchase {
  const sorted = [...rows].sort((left, right) => left.installmentNumber - right.installmentNumber);
  const total = rebuildInstallmentTotal(sorted, key.count);
  return {
    fingerprint: installmentFingerprint(options.accountId, key, smallest, occurrence),
    alternateFingerprints: Array.from({ length: maxInstallmentSpread(key.count) }, (_, index) => installmentFingerprint(options.accountId, key, smallest + index + 1, occurrence)),
    kind: "purchase",
    status: rows.some((row) => row.status === "posted") ? "posted" : "pending",
    description: withoutInstallmentMarker(sorted[0]),
    ...total,
    installmentCount: key.count,
    firstInvoiceMonth: key.firstInvoiceMonth,
    installmentPlan: installmentPlan(sorted, key, total.totalCents),
    ...purchaseDateOf(sorted, key.firstInvoiceMonth, options.closingDay),
  };
}

function groupInstallments(rows: InstallmentRow[], options: GroupOptions) {
  const resolveFirstInvoice = firstInvoiceResolver(rows);
  const keyOf = (row: InstallmentRow): PurchaseKey => ({ normalized: normalizeDescription(row.description), count: row.totalInstallments, firstInvoiceMonth: resolveFirstInvoice(row) });
  return groupBy(rows, (row) => JSON.stringify(keyOf(row))).flatMap((cluster) =>
    splitByAmount(cluster).flatMap((bucket) =>
      splitOccurrences(bucket).map((occurrence, index) => installmentPurchase(occurrence, keyOf(bucket[0]), bucket[0].amountCents, index, options))));
}

function singlePurchase(row: PluggyInvoicedCardRow): PluggyCardPurchase {
  const isRefund = row.kind === "refund";
  return {
    fingerprint: singlePaymentFingerprint(row.remoteId),
    alternateFingerprints: [],
    kind: isRefund ? "adjustment" : "purchase",
    status: row.status,
    description: row.description,
    totalCents: isRefund ? -row.amountCents : row.amountCents,
    residualCents: 0,
    installmentCount: 1,
    firstInvoiceMonth: row.invoiceMonth,
    purchaseDate: row.purchaseDate ?? row.date,
    dateIsApproximate: false,
  };
}

/** Pure. Pluggy returns one record per installment, with no identifier linking those of one purchase. */
export function groupCardPurchases(rows: PluggyInvoicedCardRow[], options: GroupOptions): PluggyCardPurchase[] {
  const installments = rows.filter(isInstallment);
  const singles = rows.filter((row) => !isInstallment(row)).map(singlePurchase);
  return [...singles, ...groupInstallments(installments, options)]
    .sort((left, right) => left.purchaseDate.localeCompare(right.purchaseDate) || left.fingerprint.localeCompare(right.fingerprint));
}

/** The last invoice is enough: a purchase with one inside the window still has money due there. */
export function endsBeforeCutoff(purchase: Pick<PluggyCardPurchase, "firstInvoiceMonth" | "installmentCount">, cutoffDate: string) {
  return shiftMonth(purchase.firstInvoiceMonth, purchase.installmentCount - 1) < cutoffDate.slice(0, 7);
}
