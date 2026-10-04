"use client";

import { InvestmentReductionDialog } from "@/components/finance/investment-reduction-dialog";
import type { TransactionDialogInvestmentReductionDialog8Props } from "@/lib/interfaces/render/transaction-dialog-transaction-dialog-investment-reduction-dialog8";

export function TransactionDialogInvestmentReductionDialog8({ isReductionOpen, transaction, reductionAmountCents, previousSelections, reductionSources, isPending, setIsReductionOpen, clearReductionState, startTransition, confirmReduction }: TransactionDialogInvestmentReductionDialog8Props) {
  return (
<InvestmentReductionDialog
        key={`transaction-reduction-${isReductionOpen}-${transaction?.id ?? "new"}-${reductionAmountCents}-${previousSelections.map((selection) => `${selection.sourceId}:${selection.amountCents}`).join("|")}`}
        open={isReductionOpen}
        title={
          transaction
            ? "Redistribuir a origem do resgate"
            : "De onde saiu o resgate?"
        }
        description="Selecione os ativos, saldos livres ou patrimônio não cadastrado que deram origem a este resgate."
        amountCents={reductionAmountCents}
        sources={reductionSources}
        initialSelections={previousSelections}
        isPending={isPending}
        onOpenChange={setIsReductionOpen}
        onCancel={clearReductionState}
        onConfirm={(selections) =>
          startTransition(() => void confirmReduction(selections))
        }
        confirmLabel={transaction ? "Salvar resgate" : "Criar resgate"}
        footerNote="A seleção fica registrada para que uma futura edição ou exclusão restaure os valores corretos."
      />
  );
}
