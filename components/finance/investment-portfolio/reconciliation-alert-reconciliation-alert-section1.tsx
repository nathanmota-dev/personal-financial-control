"use client";

import { InvestmentReductionDialog } from "@/components/finance/investment-reduction-dialog";
import { Button } from "@/components/ui/button";
import type { ReconciliationAlertSection1Props } from "@/lib/interfaces/render/reconciliation-alert-reconciliation-alert-section1";
import { AlertTriangle,Wrench } from "lucide-react";

export function ReconciliationAlertSection1({ registrationMessage, allocationMessage, reductionCents, isPending, startTransition, openReduction, isReductionOpen, dashboard, sources, setIsReductionOpen, setSources, confirmReduction }: ReconciliationAlertSection1Props) {
  return (
<>
      <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
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
