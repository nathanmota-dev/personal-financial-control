import { pluggyImportLedger } from "@/lib/db/schema";
import type { BankImportLocalRow, BankImportScope, PluggyBankClassification, PluggyBankRow } from "@/lib/interfaces/pluggy-bank-import";
import { createSingleTransactionInTransaction } from "@/lib/server/transactions/creation";
import type { TransactionValues } from "@/lib/server/transactions/validation";
import { resolveRuleCategory } from "../category-rules";
import { attributeImportedWithdrawal, tracksLinkedPositions } from "./reserve-withdrawal";
import { bump, flagAttention, ledgerValues } from "./scope";

const COUNT_NAMES: Record<Exclude<PluggyBankClassification, "own_transfer" | "card_payment">, string> = {
  ordinary: "bankOrdinary",
  investment_contribution: "bankInvestmentContribution",
  investment_withdrawal: "bankInvestmentWithdrawal",
};

export async function createBankRecord(scope: BankImportScope, row: PluggyBankRow, classification: keyof typeof COUNT_NAMES) {
  const { context, link, run } = scope;
  const isInvestment = classification !== "ordinary";
  if (isInvestment && !run.investmentCategoryId) return flagAttention(scope, row, "missing_investment_category");
  const values: TransactionValues = {
    accountId: link.accountId,
    categoryId: isInvestment ? run.investmentCategoryId : resolveRuleCategory(run.categoryRules, row.description, row.type),
    type: isInvestment ? classification : row.type,
    status: row.status,
    amountCents: row.amountCents,
    transactionDate: row.transactionDate,
    competenceMonth: row.competenceMonth,
    description: row.description,
    importFingerprint: row.fingerprint,
  };
  const holder: { row?: BankImportLocalRow } = {};
  const tracksReserve = classification === "investment_withdrawal" && await tracksLinkedPositions(scope);
  await context.write((db) => db.transaction(async (tx) => {
    const created = await createSingleTransactionInTransaction(tx, values, { externallyTracked: isInvestment });
    if (tracksReserve) created.investmentOrigin = await attributeImportedWithdrawal(tx, created);
    holder.row = created;
    await tx.insert(pluggyImportLedger).values(ledgerValues({ fingerprint: row.fingerprint, outcome: "created", localTable: "transactions", localId: created.id }, context.now));
  }));
  run.ledger.set(row.fingerprint, { fingerprint: row.fingerprint, outcome: "created", localTable: "transactions", localId: holder.row?.id ?? null });
  if (holder.row) scope.locals.set(holder.row.id, holder.row);
  bump(scope, COUNT_NAMES[classification]);
}

/** Records no transaction: linking the payment to its bill completes it later. */
export async function recordCardPayment(scope: BankImportScope, row: PluggyBankRow) {
  const { context, run } = scope;
  if (row.status !== "posted") return bump(scope, "bankDeferred");
  const entry = { fingerprint: row.fingerprint, outcome: "pending_card_payment" as const, localTable: null, localId: null };
  await context.write((db) => db.insert(pluggyImportLedger).values(ledgerValues(entry, context.now)));
  run.ledger.set(row.fingerprint, entry);
  bump(scope, "bankCardPayment");
}
