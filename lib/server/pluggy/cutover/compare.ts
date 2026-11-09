import type { CutoverAccountComparison, CutoverComparison, CutoverImportedCharge, CutoverInstallmentChange, CutoverMonthComparison, CutoverMonthTotals, CutoverReport, CutoverStraddlingCharge } from "@/lib/interfaces/pluggy-cutover";

/** The closest total wins, so two purchases alike in month and installments still pair up with the right one. */
function takeRebuiltCharge(charge: CutoverStraddlingCharge, available: CutoverImportedCharge[]) {
  const candidates = available
    .filter((item) => item.accountId === charge.accountId && item.installmentCount === charge.installmentCount && item.firstInvoiceMonth === charge.firstInvoiceMonth)
    .sort((left, right) => Math.abs(left.totalAmountCents - charge.totalAmountCents) - Math.abs(right.totalAmountCents - charge.totalAmountCents));
  if (candidates.length) available.splice(available.indexOf(candidates[0]), 1);
  return candidates[0];
}

/** The cleanup removes a whole charge, so installments before the window come back only through the rebuilt one. */
function changedInstallments(before: CutoverReport, after: CutoverReport): CutoverInstallmentChange[] {
  const available = [...after.importedCharges];
  return before.plan.warnings.straddlingCharges.flatMap((charge) => {
    const rebuilt = takeRebuiltCharge(charge, available);
    return charge.outsideInstallments.flatMap((installment) => {
      const afterCents = rebuilt?.installments.find((item) => item.installmentNumber === installment.installmentNumber)?.amountCents ?? null;
      return afterCents === installment.amountCents ? [] : [{ accountId: charge.accountId, description: charge.description, installmentNumber: installment.installmentNumber, invoiceMonth: installment.invoiceMonth, beforeCents: installment.amountCents, afterCents }];
    });
  });
}

function compareMonths(before: CutoverMonthTotals[], after: CutoverMonthTotals[]): CutoverMonthComparison[] {
  const months = [...new Set([...before, ...after].map((row) => row.month))].sort();
  return months.map((month) => ({ month, before: before.find((row) => row.month === month) ?? null, after: after.find((row) => row.month === month) ?? null }));
}

export function compareCutoverReports(before: CutoverReport, after: CutoverReport): CutoverComparison {
  const accounts: CutoverAccountComparison[] = after.accounts.map((account) => ({
    accountName: account.accountName,
    cutoffDate: account.cutoffDate,
    months: compareMonths(before.accounts.find((row) => row.accountId === account.accountId)?.months ?? [], account.months),
    invoices: account.invoices,
    balance: account.balance,
    uncategorizedCount: account.uncategorizedCount,
  }));
  return { accounts, changedInstallments: changedInstallments(before, after), unmatchedBillPayments: after.unmatchedBillPayments, pendingCardPayments: after.pendingCardPayments };
}

const money = (cents: number | null | undefined) => (cents === null || cents === undefined ? "-" : (cents / 100).toFixed(2));

function monthLines(months: CutoverMonthComparison[]) {
  const totals = (row: CutoverMonthTotals | null) => [row?.incomeCents, row?.expenseCents, row?.investmentCents, row?.fixedCents, row?.variableCents, row?.uncategorizedCents].map(money).join(" | ");
  return [
    "| Month | Before: income | expense | investment | fixed | variable | uncategorized | After: income | expense | investment | fixed | variable | uncategorized |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|",
    ...months.map(({ month, before, after }) => `| ${month} | ${totals(before)} | ${totals(after)} |`),
  ];
}

function accountLines(account: CutoverAccountComparison) {
  const lines = [`## ${account.accountName} (cutoff ${account.cutoffDate})`, "", ...monthLines(account.months), ""];
  if (account.invoices.length) {
    lines.push("| Invoice | App | Bank | Difference | Status |", "|---|---|---|---|---|");
    lines.push(...account.invoices.map((row) => `| ${row.invoiceMonth} | ${money(row.appTotalCents)} | ${money(row.bankTotalCents)} | ${money(row.differenceCents)} | ${row.status} |`), "");
  }
  if (account.balance) {
    lines.push(`Balance: app ${money(account.balance.appCents)}, bank ${money(account.balance.bankCents)}, difference ${money(account.balance.differenceCents)}.`);
    if (account.balance.proposedInitialBalanceCents !== null) lines.push(`Proposed initial balance: ${account.balance.proposedInitialBalanceCents} cents. Apply it only after confirming the difference comes from data before the window.`);
    lines.push("");
  }
  lines.push(`Uncategorized items: ${account.uncategorizedCount}.`, "");
  return lines;
}

export function renderCutoverComparison(comparison: CutoverComparison) {
  const changes = comparison.changedInstallments.map((row) => `- ${row.description}, installment ${row.installmentNumber} (${row.invoiceMonth}): ${money(row.beforeCents)} -> ${money(row.afterCents)}`);
  return [
    "# Cutover comparison",
    "",
    ...comparison.accounts.flatMap(accountLines),
    "## Installments outside the window that changed",
    "",
    ...(changes.length ? changes : ["None."]),
    "",
    `Unmatched bill payments: ${comparison.unmatchedBillPayments}.`,
    `Items in pending_card_payment: ${comparison.pendingCardPayments}.`,
    "",
  ].join("\n");
}
