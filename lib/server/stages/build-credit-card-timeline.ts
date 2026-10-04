import type { BuildCreditCardTimelineContext } from "@/lib/interfaces/stages/build-credit-card-timeline";

export function buildCreditCardTimeline({ timelineByMonth, futureChargeRows, cardTransactions, billRows }: BuildCreditCardTimelineContext) {
function timelinePoint(month: string) {
    const existing = timelineByMonth.get(month);
    if (existing) {
      return existing;
    }

    const created = {
      month,
      totalAmountCents: 0,
      purchaseCount: 0,
      billStatus: null as "open" | "paid" | null,
    };
    timelineByMonth.set(month, created);
    return created;
  }

for (const charge of futureChargeRows) {
    for (const installment of charge.installments) {
      const point = timelinePoint(installment.invoiceMonth);
      point.totalAmountCents += installment.amountCents;
      point.purchaseCount += 1;
    }
  }

for (const transaction of cardTransactions) {
    if (transaction.type !== "expense" || transaction.status === "cancelled") {
      continue;
    }

    const point = timelinePoint(transaction.competenceMonth);
    point.totalAmountCents += transaction.amountCents;
    point.purchaseCount += 1;
  }

for (const billRow of billRows) {
    const point = timelinePoint(billRow.invoiceMonth);
point.totalAmountCents = billRow.statementTotalCents;
point.billStatus = billRow.status;
  }

const timeline = Array.from(timelineByMonth.values()).sort((left, right) =>
    left.month.localeCompare(right.month)
  );
return { timeline };
}
