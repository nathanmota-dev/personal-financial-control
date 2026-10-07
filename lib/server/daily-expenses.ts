import type { DailyExpenseEntry } from "@/lib/interfaces/daily-expenses";
import { buildDailyExpenseMap } from "@/lib/daily-expenses";
import { getFinanceDatabase, type AppDb } from "@/lib/db";
import { normalizeCompetenceMonth } from "@/lib/server/finance";

export async function getDailyExpenseMap(period: string, database?: AppDb) {
  const month = normalizeCompetenceMonth(period);
  const db = database ?? await getFinanceDatabase();
  const [transactionRows, chargeRows, paymentRows] = await Promise.all([
    db.query.transactions.findMany({ with: { account: true, category: true } }),
    db.query.creditCardCharges.findMany({ with: { account: true, category: true } }),
    db.query.creditCardBillPayments.findMany({ columns: { transactionId: true } }),
  ]);
  const paymentTransactionIds = new Set(paymentRows.map((payment) => payment.transactionId));
  const prefix = `${month}-`;
  const commonEntries: DailyExpenseEntry[] = transactionRows
    .filter((row) => row.status === "posted" && row.type === "expense" && row.transactionDate.startsWith(prefix) && !paymentTransactionIds.has(row.id))
    .map((row) => ({
      id: row.id,
      date: row.transactionDate,
      description: row.description,
      amountCents: Math.abs(row.amountCents),
      direction: row.amountCents < 0 ? "credit" : "expense",
      source: "transaction",
      category: row.category?.name ?? "Sem categoria",
      account: row.account?.name ?? "Conta",
      sourceHref: `/transactions?month=${row.competenceMonth}`,
    }));
  const cardEntries: DailyExpenseEntry[] = chargeRows
    .filter((row) => row.purchaseDate.startsWith(prefix))
    .map((row) => ({
      id: row.id,
      date: row.purchaseDate,
      description: row.description,
      amountCents: Math.abs(row.totalAmountCents),
      direction: row.kind === "adjustment" || row.totalAmountCents < 0 ? "credit" : "expense",
      source: "credit_card_charge",
      category: row.category?.name ?? "Sem categoria",
      account: row.account?.name ?? "Cartão",
      sourceHref: `/credit-card?month=${row.firstInvoiceMonth}`,
    }));

  return buildDailyExpenseMap(month, [...commonEntries, ...cardEntries]);
}
