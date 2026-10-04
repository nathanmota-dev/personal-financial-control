import type { AppDb } from "@/lib/db";
import {
transfers
} from "@/lib/db/schema";
import type { ProjectionEvent } from "@/lib/interfaces/projected-balance";
import type {
ProjectedBalanceAccountRow,
ProjectedBalanceTransferRow
} from "@/lib/interfaces/projected-balance-server";
import { listCreditCardExpenseEntries } from "@/lib/server/credit-card";
import { buildDateInMonth } from "@/lib/utils/finance-month";
import { and,gte,inArray,lte,or } from "drizzle-orm";
import { accountIdSet } from "./accounts";
import { listMonths } from "./filters";

export async function listCreditCardEvents(
  db: AppDb,
  startDate: string,
  endDate: string,
  selectedCreditAccounts: ProjectedBalanceAccountRow[]
) {
  if (!selectedCreditAccounts.length) {
    return [];
  }

  const creditAccountIds = new Set(selectedCreditAccounts.map((account) => account.id));
  const creditAccountsById = new Map(
    selectedCreditAccounts.map((account) => [account.id, account])
  );
  const events: ProjectionEvent[] = [];

  for (const month of listMonths(startDate, endDate)) {
    const invoiceEntries = await listCreditCardExpenseEntries(month, db);
    const totalsByAccountId = new Map<string, { amountCents: number; entryCount: number }>();

    for (const entry of invoiceEntries) {
      if (!entry.account?.id || !creditAccountIds.has(entry.account.id)) {
        continue;
      }

      const current = totalsByAccountId.get(entry.account.id) ?? {
        amountCents: 0,
        entryCount: 0,
      };
      current.amountCents += entry.amountCents;
      current.entryCount += 1;
      totalsByAccountId.set(entry.account.id, current);
    }

    for (const [accountId, total] of totalsByAccountId) {
      const account = creditAccountsById.get(accountId);

      if (!account) {
        continue;
      }

      const dueDate = buildDateInMonth(month, account.creditDueDay);

      if (dueDate < startDate || dueDate > endDate) {
        continue;
      }

      events.push({
        id: `credit-card:${accountId}:${month}`,
        source: "credit_card",
        type: "credit_card",
        description: `Fatura ${account.name} ${month}`,
        amountCents: total.amountCents,
        netImpactCents: -total.amountCents,
        date: dueDate,
        accountId,
        metadata: {
          accountName: account.name,
          invoiceMonth: month,
          dueDay: account.creditDueDay,
          entryCount: total.entryCount,
        },
      });
    }
  }

  return events;
}

export async function listTransferEvents(
  db: AppDb,
  startDate: string,
  endDate: string,
  selectedAccounts: ProjectedBalanceAccountRow[]
) {
  const ids = selectedAccounts.map((account) => account.id);

  if (!ids.length) {
    return [];
  }

  const selectedAccountIds = accountIdSet(selectedAccounts);
  const rows = await db.query.transfers.findMany({
    where: and(
      or(inArray(transfers.fromAccountId, ids), inArray(transfers.toAccountId, ids)),
      gte(transfers.transferDate, startDate),
      lte(transfers.transferDate, endDate)
    ),
    with: {
      fromAccount: true,
      toAccount: true,
    },
  });
  const events: ProjectionEvent[] = [];

  for (const transfer of rows as ProjectedBalanceTransferRow[]) {
    const fromIncluded = selectedAccountIds.has(transfer.fromAccountId);
    const toIncluded = selectedAccountIds.has(transfer.toAccountId);

    if (fromIncluded === toIncluded) {
      continue;
    }

    const isIncoming = toIncluded;

    events.push({
      id: transfer.id,
      source: "transfer",
      type: "transfer",
      description: transfer.description,
      amountCents: transfer.amountCents,
      netImpactCents: isIncoming ? transfer.amountCents : -transfer.amountCents,
      date: transfer.transferDate,
      accountId: isIncoming ? transfer.toAccountId : transfer.fromAccountId,
      metadata: {
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        fromAccountName: transfer.fromAccount?.name ?? null,
        toAccountName: transfer.toAccount?.name ?? null,
        competenceMonth: transfer.competenceMonth,
      },
    });
  }

  return events;
}
