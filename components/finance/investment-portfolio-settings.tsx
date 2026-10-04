"use client";

import { InvestmentPortfolioSettingsConfirmReduction } from "@/lib/utils/component-actions/investment-portfolio-settings-confirm-reduction";
import { InvestmentPortfolioSettingsOnConfigure } from "@/lib/utils/component-actions/investment-portfolio-settings-on-configure";
import { InvestmentPortfolioSettingsOnReconcile } from "@/lib/utils/component-actions/investment-portfolio-settings-on-reconcile";
import { InvestmentPortfolioSettingsOnUpdateRate } from "@/lib/utils/component-actions/investment-portfolio-settings-on-update-rate";
import { InvestmentPortfolioSettingsSaveReconciliation } from "@/lib/utils/component-actions/investment-portfolio-settings-save-reconciliation";
import { formatRateInput,todayDate } from "@/lib/utils/components/investment-portfolio-settings";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { InvestmentPortfolioSettingsCard1 } from "./investment-portfolio-settings-investment-portfolio-settings-card1";
import { InvestmentPortfolioSettingsCard2 } from "./investment-portfolio-settings-investment-portfolio-settings-card2";
import { InvestmentPortfolioSettingsDialog3 } from "./investment-portfolio-settings-investment-portfolio-settings-dialog3";

import { InvestmentReductionDialog } from "@/components/finance/investment-reduction-dialog";
import {
centsToMoneyInput
} from "@/lib/finance-ui";
import type {
InvestmentReductionSelection,
InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";
import type { InvestmentPortfolioSettingsProps } from "@/lib/interfaces/investments";

export function InvestmentPortfolioSettings({ projection }: InvestmentPortfolioSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rate, setRate] = useState(
    projection ? formatRateInput(projection.expectedMonthlyRateBps) : "1,00"
  );
  const [initialBalance, setInitialBalance] = useState("0,00");
  const [initialDate, setInitialDate] = useState(todayDate());
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [reconciledBalance, setReconciledBalance] = useState(
    projection ? centsToMoneyInput(projection.currentBalanceCents) : "0,00"
  );
  const [reconciledDate, setReconciledDate] = useState(
    projection?.asOfDate ?? todayDate()
  );
  const [isReductionOpen, setIsReductionOpen] = useState(false);
  const [reductionSources, setReductionSources] = useState<InvestmentReductionSource[]>([]);
  const [pendingReconciliation, setPendingReconciliation] = useState<{
    checkpointBalanceCents: number;
    checkpointDate: string;
    amountCents: number;
  } | null>(null);

  async function onConfigure() {
    return InvestmentPortfolioSettingsOnConfigure({ initialBalance, rate, initialDate, router });
  }

  async function onUpdateRate() {
    return InvestmentPortfolioSettingsOnUpdateRate({ rate, router });
  }

  async function onReconcile() {
    return InvestmentPortfolioSettingsOnReconcile({ projection, reconciledBalance, setReductionSources, setPendingReconciliation, reconciledDate, setIsReconcileOpen, setIsReductionOpen, saveReconciliation, router });
  }

  async function saveReconciliation(input: {
    checkpointBalanceCents: number;
    checkpointDate: string;
    sourceSelections?: InvestmentReductionSelection[];
  }) {
    return InvestmentPortfolioSettingsSaveReconciliation({  }, input);
  }

  async function confirmReduction(selections: InvestmentReductionSelection[]) {
    return InvestmentPortfolioSettingsConfirmReduction({ pendingReconciliation, saveReconciliation, setIsReductionOpen, setPendingReconciliation, setReductionSources, router }, selections);
  }

  if (!projection) {
    return (
      <InvestmentPortfolioSettingsCard1 initialBalance={initialBalance} setInitialBalance={setInitialBalance} initialDate={initialDate} setInitialDate={setInitialDate} rate={rate} setRate={setRate} isPending={isPending} startTransition={startTransition} onConfigure={onConfigure} />
    );
  }

  return (
    <>
      <InvestmentPortfolioSettingsCard2 projection={projection} rate={rate} setRate={setRate} isPending={isPending} startTransition={startTransition} onUpdateRate={onUpdateRate} setReconciledBalance={setReconciledBalance} setReconciledDate={setReconciledDate} setIsReconcileOpen={setIsReconcileOpen} />

      <InvestmentPortfolioSettingsDialog3 isReconcileOpen={isReconcileOpen} setIsReconcileOpen={setIsReconcileOpen} reconciledBalance={reconciledBalance} setReconciledBalance={setReconciledBalance} reconciledDate={reconciledDate} setReconciledDate={setReconciledDate} isPending={isPending} startTransition={startTransition} onReconcile={onReconcile} />
      <InvestmentReductionDialog
        key={`investment-reduction-${isReductionOpen}-${pendingReconciliation?.amountCents ?? "none"}-${pendingReconciliation?.checkpointDate ?? "none"}`}
        open={isReductionOpen}
        title="De onde saiu a diferença?"
        description="A conferência reduziu o saldo global. Escolha manualmente quais ativos e caixinhas acompanharam essa queda."
        amountCents={pendingReconciliation?.amountCents ?? 0}
        sources={reductionSources}
        isPending={isPending}
        onOpenChange={setIsReductionOpen}
        onCancel={() => {
          setIsReductionOpen(false);
          setPendingReconciliation(null);
          setReductionSources([]);
        }}
        onConfirm={(selections) => startTransition(() => void confirmReduction(selections))}
        confirmLabel="Confirmar conferência"
        footerNote="Nenhuma fonte é escolhida automaticamente; a confirmação salva somente a distribuição exibida."
      />
    </>
  );
}
