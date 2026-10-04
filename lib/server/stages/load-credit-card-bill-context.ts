import {
creditCardBills
} from "@/lib/db/schema";
import type { LoadCreditCardBillContextContext } from "@/lib/interfaces/stages/load-credit-card-bill-context";
import { and,eq } from "drizzle-orm";

export async function loadCreditCardBillContext({ db, account, normalizedMonth }: LoadCreditCardBillContextContext) {
const bill = await db.query.creditCardBills.findFirst({
    where: and(
      eq(creditCardBills.accountId, account.id),
      eq(creditCardBills.invoiceMonth, normalizedMonth)
    ),
    with: {
      payments: true,
    },
  });

const paymentTransactionIds = new Set(
    (await db.query.creditCardBillPayments.findMany()).map((payment) => payment.transactionId)
  );
return { paymentTransactionIds, bill };
}
