import type { AppDb } from "@/lib/db";
import type { CutoverWindow } from "@/lib/interfaces/pluggy-cutover";
import type { PluggyAccountKind } from "@/lib/interfaces/pluggy";

/** Everything a plan or report reads. Dates are encrypted, so the windows are applied in memory after decryption. */
export async function loadCutoverData(db: AppDb) {
  const query = db.query;
  const [items, links, accounts, templates, transactions, transfers, charges, bills, payments, fundingLinks, goalAllocations, reductionEvents, ledger] = await Promise.all([
    query.pluggyItems.findMany(),
    query.pluggyAccountLinks.findMany(),
    query.accounts.findMany(),
    query.recurringTemplates.findMany(),
    query.transactions.findMany({ with: { category: true } }),
    query.transfers.findMany(),
    query.creditCardCharges.findMany({ with: { installments: true, category: true } }),
    query.creditCardBills.findMany(),
    query.creditCardBillPayments.findMany(),
    query.transactionFundingLinks.findMany(),
    query.financialGoalAllocations.findMany({ with: { goal: true } }),
    query.investmentReductionEvents.findMany(),
    query.pluggyImportLedger.findMany(),
  ]);
  return { items, links, accounts, templates, transactions, transfers, charges, bills, payments, fundingLinks, goalAllocations, reductionEvents, ledger };
}

export type CutoverData = Awaited<ReturnType<typeof loadCutoverData>>;

/** Disabled links are ignored by the sync, so the bank would not restore what is removed under them. */
export function resolveCutoverWindows({ links, accounts }: Pick<CutoverData, "links" | "accounts">): CutoverWindow[] {
  const earliest = new Map<string, { cutoffDate: string; kind: PluggyAccountKind }>();
  for (const link of links.filter((row) => row.isEnabled)) {
    const current = earliest.get(link.accountId);
    if (!current || link.cutoffDate < current.cutoffDate) earliest.set(link.accountId, { cutoffDate: link.cutoffDate, kind: link.kind });
  }
  return accounts
    .flatMap((account) => {
      const window = earliest.get(account.id);
      return window ? [{ accountId: account.id, accountName: account.name, kind: window.kind, cutoffDate: window.cutoffDate, cutoffMonth: window.cutoffDate.slice(0, 7) }] : [];
    })
    .sort((left, right) => left.accountName.localeCompare(right.accountName));
}
