import { todayDate } from "@/lib/utils/finance-date";
"use client";

import { CheckCircle2,Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { toast } from "sonner";
import { ReconciliationAlertSection1 } from "./reconciliation-alert-reconciliation-alert-section1";

import {
applyInvestmentReductionAction,
getInvestmentReductionSourcesAction,
} from "@/app/actions/finance";
import { extractErrorMessage,formatCurrency,formatDateLabel } from "@/lib/finance-ui";
import type { ReconciliationAlertProps } from "@/lib/interfaces/investment-portfolio";
import type { InvestmentReductionSelection,InvestmentReductionSource } from "@/lib/interfaces/investment-reconciliation";

export function ReconciliationAlert({ dashboard }: ReconciliationAlertProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isReductionOpen, setIsReductionOpen] = useState(false);
  const [sources, setSources] = useState<InvestmentReductionSource[]>([]);

  const { reconciliation, overAllocatedCents, globalBalanceCents, totalRegisteredCents } =
    dashboard;

  if (reconciliation.state === "aligned" && overAllocatedCents === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-warning">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="leading-6">
          Os ativos cadastrados fecham com o saldo global em{" "}
          {formatDateLabel(
            dashboard.investmentProjection?.asOfDate ??
              dashboard.lastValueAsOf ??
              "2026-01-01"
          )}
          .
        </p>
      </div>
    );
  }

  if (reconciliation.state === "not_configured") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/8 px-4 py-3 text-sm text-brand">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <p className="leading-6">
          A carteira global ainda não tem checkpoint. Os percentuais usam os{" "}
          {formatCurrency(dashboard.totalRegisteredCents)} cadastrados como base até você
          configurar o saldo em{" "}
          <Link className="font-semibold text-brand underline underline-offset-4" href="/investments">
            Investimentos
          </Link>
          .
        </p>
      </div>
    );
  }

  const differenceCents = Math.abs(reconciliation.differenceCents ?? 0);
  const registrationMessage =
    reconciliation.state === "registered_above_global"
      ? "Os ativos cadastrados superam o saldo global em " + formatCurrency(differenceCents) + "."
      : "Faltam " +
        formatCurrency(differenceCents) +
        " em ativos cadastrados para fechar com o saldo global.";
  const allocationMessage =
    overAllocatedCents > 0
      ? "As caixinhas também estão " + formatCurrency(overAllocatedCents) + " acima do saldo global."
      : "Há " +
        formatCurrency(
          Math.max((globalBalanceCents ?? totalRegisteredCents) - dashboard.totalAllocatedCents, 0)
        ) +
        " ainda sem caixinha.";

  const reductionCents = Math.max(reconciliation.differenceCents ?? 0, 0);

  async function openReduction() {
    try {
      const result = await getInvestmentReductionSourcesAction();
      setSources(result.sources);
      setIsReductionOpen(true);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function confirmReduction(selections: InvestmentReductionSelection[]) {
    try {
      await applyInvestmentReductionAction({
        amountCents: reductionCents,
        eventType: "reconciliation",
        occurredOn: todayDate(),
        sourceSelections: selections,
      });
      toast.success("As fontes da carteira foram reconciliadas.");
      setIsReductionOpen(false);
      setSources([]);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <ReconciliationAlertSection1 registrationMessage={registrationMessage} allocationMessage={allocationMessage} reductionCents={reductionCents} isPending={isPending} startTransition={startTransition} openReduction={openReduction} isReductionOpen={isReductionOpen} dashboard={dashboard} sources={sources} setIsReductionOpen={setIsReductionOpen} setSources={setSources} confirmReduction={confirmReduction} />
  );
}

export { todayDate } from "@/lib/utils/finance-date";
