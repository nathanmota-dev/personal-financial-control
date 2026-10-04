import type { AppDb } from "@/lib/db";
import {
transactions,
transfers
} from "@/lib/db/schema";
import type {
ProjectedBalanceAccountRow
} from "@/lib/interfaces/projected-balance-server";
import { invariant } from "@/lib/server/errors";
import { and,eq,inArray,lt,or } from "drizzle-orm";
import { projectableAccountTypes } from "./filters";

export function ensureProjectableAccount(
  account: ProjectedBalanceAccountRow,
  requestedId?: string
) {
  invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Account is archived.");
  invariant(
    projectableAccountTypes.has(account.type),
    "ACCOUNT_TYPE_NOT_PROJECTABLE",
    requestedId
      ? "accountId must reference a checking, savings, or cash account."
      : "Only checking, savings, and cash accounts are included in projections."
  );
}

export function accountIdSet(accountsToProject: ProjectedBalanceAccountRow[]) {
  return new Set(accountsToProject.map((account) => account.id));
}

export async function resolveProjectionAccounts(
  db: AppDb,
  requestedAccountIds: string[],
  requestedCreditAccountIds: string[]
) {
  const allAccounts = await db.query.accounts.findMany();
  const accountsById = new Map(allAccounts.map((account) => [account.id, account]));

  const selectedAccounts = requestedAccountIds.length
    ? requestedAccountIds.map((id) => {
        const account = accountsById.get(id);
        invariant(account, "ACCOUNT_NOT_FOUND", "Projection account does not exist.", 404);
        ensureProjectableAccount(account, id);
        return account;
      })
    : allAccounts.filter(
        (account) =>
          !account.isArchived && projectableAccountTypes.has(account.type)
      );

  const selectedCreditAccounts = requestedCreditAccountIds.length
    ? requestedCreditAccountIds.map((id) => {
        const account = accountsById.get(id);
        invariant(account, "ACCOUNT_NOT_FOUND", "Credit card account does not exist.", 404);
        invariant(!account.isArchived, "ACCOUNT_ARCHIVED", "Credit card account is archived.");
        invariant(
          account.type === "credit",
          "ACCOUNT_TYPE_NOT_CREDIT",
          "creditAccountId must reference a credit account."
        );
        return account;
      })
    : requestedAccountIds.length
      ? []
      : allAccounts.filter((account) => !account.isArchived && account.type === "credit");

  return {
    selectedAccounts,
    selectedCreditAccounts,
  };
}

export async function calculateInitialBalance(
  db: AppDb,
  startDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[]
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return 0;
  }

  const [transactionRows, transferRows] = await Promise.all([
    db.query.transactions.findMany({
      where: and(
        inArray(transactions.accountId, ids),
        eq(transactions.status, "posted"),
        lt(transactions.transactionDate, startDate)
      ),
    }),
    db.query.transfers.findMany({
      where: and(
        lt(transfers.transferDate, startDate),
        or(inArray(transfers.fromAccountId, ids), inArray(transfers.toAccountId, ids))
      ),
    }),
  ]);
  const selectedAccountIds = accountIdSet(selectedAccounts);
  const initialBalancesCents = selectedAccounts.reduce(
    (total, account) => total + account.initialBalanceCents,
    0
  );
  const transactionImpactCents = transactionRows.reduce((total, transaction) => {
    if (transaction.type === "income") {
      return total + transaction.amountCents;
    }

    if (transaction.type === "investment_withdrawal") {
      return total + transaction.amountCents;
    }

    return total - transaction.amountCents;
  }, 0);
  const transferImpactCents = transferRows.reduce((total, transfer) => {
    const fromIncluded = selectedAccountIds.has(transfer.fromAccountId);
    const toIncluded = selectedAccountIds.has(transfer.toAccountId);

    if (fromIncluded && toIncluded) {
      return total;
    }

    if (fromIncluded) {
      return total - transfer.amountCents;
    }

    if (toIncluded) {
      return total + transfer.amountCents;
    }

    return total;
  }, 0);

  return initialBalancesCents + transactionImpactCents + transferImpactCents;
}
