import type { ValidateCreditCardPaymentAccountsContext } from "@/lib/interfaces/stages/validate-credit-card-payment-accounts";
import { getAccountById } from "@/lib/server/accounts";
import { invariant } from "@/lib/server/errors";

export async function validateCreditCardPaymentAccounts({ values, db, getBillByAccountAndMonth }: ValidateCreditCardPaymentAccountsContext) {
const cardAccount = await getAccountById(values.accountId, db);

const paymentAccount = await getAccountById(values.paymentAccountId, db);

invariant(!cardAccount.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived card account.");

invariant(!paymentAccount.isArchived, "ACCOUNT_ARCHIVED", "Cannot use an archived payment account.");

invariant(
    cardAccount.type === "credit",
    "ACCOUNT_TYPE_MISMATCH",
    "Credit card payments require a credit card account."
  );

invariant(
    paymentAccount.type === "checking" ||
      paymentAccount.type === "savings" ||
      paymentAccount.type === "cash",
    "INVALID_PAYMENT_ACCOUNT",
    "Credit card payments require a checking, savings, or cash account."
  );

const bill =
    values.kind === "unlinked"
      ? null
      : await getBillByAccountAndMonth(values.accountId, values.invoiceMonth, db);

if (values.kind !== "unlinked") {
    invariant(bill, "CREDIT_CARD_BILL_NOT_FOUND", "Credit card bill does not exist.", 404);
    invariant(
      bill.status !== "paid",
      "CREDIT_CARD_BILL_ALREADY_PAID",
      "Credit card bill is already paid."
    );
  }
return { cardAccount, bill };
}
