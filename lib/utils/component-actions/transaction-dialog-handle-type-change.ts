import type { TransactionDialogHandleTypeChangeContext } from "@/lib/interfaces/component-actions/transaction-dialog-handle-type-change";
import type {
TransactionRow
} from "@/lib/interfaces/transactions";
import { NO_CATEGORY_VALUE,accountValue,categoryValue } from "@/lib/utils/components/transaction-dialog";

export function TransactionDialogHandleTypeChange({ setSelectedType, setFundingSource, fundingSource, setSelectedAccountId, accounts, selectedAccountId, selectedCategoryId, setSelectedCategoryId, categories }: TransactionDialogHandleTypeChangeContext, value: string) {
    const nextType = value as TransactionRow["type"];
    setSelectedType(nextType);
    setFundingSource(nextType === "expense" ? fundingSource : "account");
    setSelectedAccountId(accountValue(accounts, nextType, selectedAccountId));
    const currentCategoryId =
      selectedCategoryId === NO_CATEGORY_VALUE ? null : selectedCategoryId;
    setSelectedCategoryId(
      categoryValue(categories, nextType, currentCategoryId),
    );
  }
