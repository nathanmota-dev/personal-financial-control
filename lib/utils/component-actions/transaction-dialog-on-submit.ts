import {
getInvestmentReductionSourcesAction
} from "@/app/actions/finance";
import type { TransactionDialogOnSubmitContext } from "@/lib/interfaces/component-actions/transaction-dialog-on-submit";
import { needsInvestmentReductionConfirmation } from "@/lib/transaction-reduction";
import { todayDate } from "@/lib/utils/components/transaction-dialog";
import { parseTransactionForm } from "./parse-transaction-form";

export async function TransactionDialogOnSubmit({ setFormError, showError, transaction, setReductionSources, setReductionAmountCents, setPreviousSelections, setPendingPayload, setIsReductionOpen, persistTransaction }: TransactionDialogOnSubmitContext, formData: FormData) {
    setFormError(null);
    const payload = parseTransactionForm({ showError, transaction }, formData);
    if (!payload) return;

    try {
      if (
        needsInvestmentReductionConfirmation(payload, transaction, todayDate())
      ) {
        const sourceResult = await getInvestmentReductionSourcesAction({
          transactionId:
            transaction?.fundingLink?.withdrawalTransactionId ??
            transaction?.id,
        });

        if (
          (sourceResult.sources.length > 0 ||
            sourceResult.previousSelections.length > 0) &&
          (!sourceResult.checkpointDate ||
            payload.transactionDate > sourceResult.checkpointDate)
        ) {
          setReductionSources(sourceResult.sources);
          setReductionAmountCents(payload.amountCents);
          setPreviousSelections(sourceResult.previousSelections);
          setPendingPayload(payload);
          setIsReductionOpen(true);
          return;
        }
      }

      await persistTransaction(payload);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o lançamento.";
      showError(message);
    }
  }
