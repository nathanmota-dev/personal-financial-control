import { createHash } from "node:crypto";

import type { PluggyCardPurchase, PluggyCardRow, PluggyInvoicedCardRow } from "@/lib/interfaces/pluggy-card-import";
import { resolveFirstInvoiceMonth, shiftMonth } from "@/lib/server/credit-card/validation";
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
  const billedMonths = new Map(rows.filter((row) => row.billed && row.purchaseDate).map((row) => [purchaseIdentity(row), firstInvoiceOf(row)]));
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

/** Installments of one purchase can differ by the one cent that `splitInstallmentAmounts` places on the first ones. */
function splitByAmount(rows: InstallmentRow[]) {
  const buckets: InstallmentRow[][] = [];
  for (const row of [...rows].sort((left, right) => left.amountCents - right.amountCents)) {
    const bucket = buckets.at(-1);
    if (bucket && row.amountCents - bucket[0].amountCents <= 1) bucket.push(row);
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

function installmentPurchase(rows: InstallmentRow[], key: PurchaseKey, smallest: number, occurrence: number, options: GroupOptions): PluggyCardPurchase {
  const sorted = [...rows].sort((left, right) => left.installmentNumber - right.installmentNumber);
  return {
    fingerprint: installmentFingerprint(options.accountId, key, smallest, occurrence),
    alternateFingerprints: [installmentFingerprint(options.accountId, key, smallest + 1, occurrence)],
    kind: "purchase",
    status: rows.some((row) => row.status === "posted") ? "posted" : "pending",
    description: withoutInstallmentMarker(sorted[0]),
    ...rebuildInstallmentTotal(sorted, key.count),
    installmentCount: key.count,
    firstInvoiceMonth: key.firstInvoiceMonth,
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
