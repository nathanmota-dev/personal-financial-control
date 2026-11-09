import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { inArray } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { creditCardBillPayments, creditCardBills, creditCardCharges, creditCardInstallments, transactions, transfers } from "@/lib/db/schema";
import type { CutoverAccountPlan, CutoverPlan } from "@/lib/interfaces/pluggy-cutover";
import { pauseRecurringTemplate } from "@/lib/server/recurring/templates";
import { deleteTransactionInTransaction } from "@/lib/server/transactions";

type CutoverTransaction = Parameters<Parameters<AppDb["transaction"]>[0]>[0];

const DELETE_BATCH_SIZE = 500;

async function deleteIn(tx: CutoverTransaction, table: SQLiteTable, column: SQLiteColumn, ids: string[]) {
  for (let start = 0; start < ids.length; start += DELETE_BATCH_SIZE) {
    await tx.delete(table).where(inArray(column, ids.slice(start, start + DELETE_BATCH_SIZE)));
  }
}

/** The order is part of the contract: templates stop first, and each step removes what the next one would trip on. */
async function applyAccount(tx: CutoverTransaction, plan: CutoverAccountPlan) {
  for (const id of plan.templateIds) await pauseRecurringTemplate(id, tx);
  await deleteIn(tx, creditCardBillPayments, creditCardBillPayments.id, plan.billPaymentIds);
  await deleteIn(tx, transactions, transactions.id, plan.billPaymentTransactionIds);
  await deleteIn(tx, creditCardBills, creditCardBills.id, plan.billIds);
  // Removed directly: a charge straddling the window may touch a paid bill before it, and that bill must stay.
  await deleteIn(tx, creditCardInstallments, creditCardInstallments.chargeId, plan.chargeIds);
  await deleteIn(tx, creditCardCharges, creditCardCharges.id, plan.chargeIds);
  await deleteIn(tx, transactions, transactions.id, plan.ordinaryTransactionIds);
  // One by one, because these reverse investment reductions and remove their funding pair.
  for (const id of plan.managedTransactionIds) await deleteTransactionInTransaction(id, tx);
  await deleteIn(tx, transfers, transfers.id, plan.transferIds);
}

function hasWork(plan: CutoverAccountPlan) {
  return Object.values(plan.counts).some((count) => count > 0);
}

/** One database transaction per account. A failure keeps earlier accounts, and running again continues from there. */
export async function applyCutoverPlan(db: AppDb, plan: CutoverPlan) {
  for (const account of plan.accounts.filter(hasWork)) {
    await db.transaction((tx) => applyAccount(tx, account));
  }
}
