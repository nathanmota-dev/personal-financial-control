import type { TransactionDialogResetFormStateContext } from "@/lib/interfaces/component-actions/transaction-dialog-reset-form-state";
import { accountValue,categoryValue } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogResetFormState({ transaction, setSelectedType, setSelectedAccountId, accounts, setSelectedCategoryId, categories, setTransactionDate, month, setCompetenceMonth, setFundingSource, setFormError }: TransactionDialogResetFormStateContext) {
    const type = transaction?.type ?? "expense";
    setSelectedType(type);
    setSelectedAccountId(accountValue(accounts, type, transaction?.accountId));
    setSelectedCategoryId(
      categoryValue(categories, type, transaction?.categoryId),
    );
    setTransactionDate(transaction?.transactionDate ?? `${month}-01`);
    setCompetenceMonth(transaction?.competenceMonth ?? month);
    setFundingSource(transaction?.fundingSource ?? "account");
    setFormError(null);
  }
