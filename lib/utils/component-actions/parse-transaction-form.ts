import {
moneyInputToCents
} from "@/lib/finance-ui";
import type { TransactionDialogOnSubmitContext } from "@/lib/interfaces/component-actions/transaction-dialog-on-submit";
import type { TransactionFundingSource } from "@/lib/interfaces/transaction-funding";
import type {
TransactionMutationPayload
} from "@/lib/interfaces/transactions";
import { NO_CATEGORY_VALUE,investmentType } from "@/lib/utils/components/transaction-dialog";

export function parseTransactionForm({ showError, transaction }: Pick<TransactionDialogOnSubmitContext, "showError" | "transaction">, formData: FormData) {
const accountId = String(formData.get("accountId") ?? "").trim();
const categoryValueFromForm = String(
      formData.get("categoryId") ?? "",
    ).trim();
const categoryId =
      categoryValueFromForm && categoryValueFromForm !== NO_CATEGORY_VALUE
        ? categoryValueFromForm
        : null;
const description = String(formData.get("description") ?? "").trim();
const rawAmount = String(formData.get("amount") ?? "").trim();
const type = String(
      formData.get("type"),
    ) as TransactionMutationPayload["type"];
const status = String(
      formData.get("status"),
    ) as TransactionMutationPayload["status"];
const requestedFundingSource = String(
      formData.get("fundingSource") ?? "account",
    ) as TransactionFundingSource;
const transactionDate = String(formData.get("transactionDate") ?? "");
const competenceMonth = String(formData.get("competenceMonth") ?? "");
if (!accountId) {
      showError("Selecione uma conta para o lançamento.");
      return;
    }
if (!description) {
      showError("Informe uma descrição para o lançamento.");
      return;
    }
let amountCents: number;
try {
      amountCents = moneyInputToCents(rawAmount);
    } catch {
      showError("Informe um valor monetário válido.");
      return;
    }
if (amountCents <= 0) {
      showError("Informe um valor maior que zero.");
      return;
    }
if (!transactionDate || !competenceMonth) {
      showError("Informe a data e a competência do lançamento.");
      return;
    }
if (investmentType(type) && !categoryId) {
      showError("Aportes e resgates exigem uma categoria.");
      return;
    }
const payload: TransactionMutationPayload = {
      accountId,
      categoryId,
      type,
      status,
      amountCents,
      transactionDate,
      competenceMonth,
      description,
      notes: String(formData.get("notes") ?? ""),
      fundingSource:
        type === "expense" && !transaction?.recurringTemplateId
          ? requestedFundingSource
          : "account",
    };
return payload;
}
