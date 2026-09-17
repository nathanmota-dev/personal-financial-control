"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, Wrench } from "lucide-react";
import { toast } from "sonner";

import {
  applyInvestmentReductionAction,
  getInvestmentReductionSourcesAction,
} from "@/app/actions/finance";
import { InvestmentReductionDialog } from "@/components/finance/investment-reduction-dialog";
import { Button } from "@/components/ui/button";
import type { ReconciliationAlertProps } from "@/lib/interfaces/investment-portfolio";
import type { InvestmentReductionSelection, InvestmentReductionSource } from "@/lib/interfaces/investment-reconciliation";
import { extractErrorMessage, formatCurrency, formatDateLabel } from "@/lib/finance-ui";

export function ReconciliationAlert({ dashboard }: ReconciliationAlertProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isReductionOpen, setIsReductionOpen] = useState(false);
  const [sources, setSources] = useState<InvestmentReductionSource[]>([]);

  const { reconciliation, overAllocatedCents, globalBalanceCents, totalRegisteredCents } =
    dashboard;

  if (reconciliation.state === "aligned" && overAllocatedCents === 0) {
    return (
      <div className="flex items-start gap-3 rounded-[1.4rem] border border-warning/20 bg-warning/8 px-4 py-3 text-sm text-warning">
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
      <div className="flex items-start gap-3 rounded-[1.4rem] border border-brand/20 bg-brand/8 px-4 py-3 text-sm text-brand">
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
    <>
      <div className="flex items-start gap-3 rounded-[1.4rem] border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
        <div className="flex min-w-0 flex-1 flex-col gap-3 leading-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>{registrationMessage}</p>
            <p className="text-warning/75">{allocationMessage}</p>
          </div>
          {reductionCents > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-warning/30 bg-warning/10 text-warning hover:bg-warning/20 hover:text-content-strong"
              disabled={isPending}
              onClick={() => startTransition(() => void openReduction())}
            >
              <Wrench className="size-4" />
              Corrigir fontes
            </Button>
          ) : null}
        </div>
      </div>
      <InvestmentReductionDialog
        key={`legacy-reduction-${isReductionOpen}-${reductionCents}-${dashboard.lastUpdatedAt ?? "none"}`}
        open={isReductionOpen}
        title="Corrigir fontes antigas"
        description="Esta divergência já existia antes do histórico de reduções. Escolha quais ativos e caixinhas devem ser ajustados para fechar com o saldo global."
        amountCents={reductionCents}
        sources={sources}
        isPending={isPending}
        onOpenChange={setIsReductionOpen}
        onCancel={() => {
          setIsReductionOpen(false);
          setSources([]);
        }}
        onConfirm={(selections) => startTransition(() => void confirmReduction(selections))}
        confirmLabel="Reconciliar carteira"
      />
    </>
  );
}

function todayDate() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
