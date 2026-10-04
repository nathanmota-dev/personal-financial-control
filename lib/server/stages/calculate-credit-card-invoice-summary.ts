import type { CalculateCreditCardInvoiceSummaryContext } from "@/lib/interfaces/stages/calculate-credit-card-invoice-summary";
import {
serializeTimestamps
} from "@/lib/server/finance";

export function calculateCreditCardInvoiceSummary({ invoiceEntries, monthTransactions, paymentTransactionIds, bill, futureChargeRows, normalizedMonth }: CalculateCreditCardInvoiceSummaryContext) {
const categoryTotals = new Map<
    string,
    { categoryId: string; categoryName: string; amountCents: number; group: string }
  >();

for (const entry of invoiceEntries) {
    if (!entry.category) {
      continue;
    }

    const current = categoryTotals.get(entry.category.id) ?? {
      categoryId: entry.category.id,
      categoryName: entry.category.name,
      amountCents: 0,
      group: entry.category.group,
    };
    current.amountCents += entry.amountCents;
    categoryTotals.set(entry.category.id, current);
  }

const activeTransactions = monthTransactions.filter(
    (row) => row.status !== "cancelled" && !paymentTransactionIds.has(row.id)
  );

const incomeCents = activeTransactions
    .filter((row) => row.type === "income")
    .reduce((total, row) => total + row.amountCents, 0);

const nonCardExpenseCents = activeTransactions
    .filter((row) => row.type === "expense" && row.account?.type !== "credit")
    .reduce((total, row) => total + row.amountCents, 0);

const investmentContributionCents = activeTransactions
    .filter((row) => row.type === "investment_contribution")
    .reduce((total, row) => total + row.amountCents, 0);

const investmentWithdrawalCents = activeTransactions
    .filter((row) => row.type === "investment_withdrawal")
    .reduce((total, row) => total + row.amountCents, 0);

const calculatedInvoiceTotalCents = invoiceEntries.reduce(
    (total, entry) => total + entry.amountCents,
    0
  );

const invoiceTotalCents = bill?.statementTotalCents ?? calculatedInvoiceTotalCents;

const availableForInvoiceCents =
    incomeCents - nonCardExpenseCents - investmentContributionCents + investmentWithdrawalCents;

const futureInstallments = futureChargeRows
    .map((charge) => {
      const remainingInstallments = charge.installments
        .filter((installment) => installment.invoiceMonth > normalizedMonth)
        .sort((left, right) => {
          return (
            left.invoiceMonth.localeCompare(right.invoiceMonth) ||
            left.installmentNumber - right.installmentNumber
          );
        });

      return {
        id: charge.id,
        categoryId: charge.categoryId,
        description: charge.description,
        purchaseDate: charge.purchaseDate,
        totalAmountCents: charge.totalAmountCents,
        installmentCount: charge.installmentCount,
        kind: charge.kind,
        notes: charge.notes,
        category: charge.category ? serializeTimestamps(charge.category) : null,
        remainingAmountCents: remainingInstallments.reduce(
          (total, installment) => total + installment.amountCents,
          0
        ),
        installments: remainingInstallments.map((installment) => ({
          ...serializeTimestamps(installment),
        })),
      };
    })
    .filter((charge) => charge.installments.length > 0);
return { incomeCents, nonCardExpenseCents, investmentContributionCents, investmentWithdrawalCents, availableForInvoiceCents, invoiceTotalCents, calculatedInvoiceTotalCents, categoryTotals, futureInstallments };
}
