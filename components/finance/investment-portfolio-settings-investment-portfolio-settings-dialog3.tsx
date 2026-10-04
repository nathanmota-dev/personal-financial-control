"use client";

import { InvestmentField } from "@/components/finance/investment-field";
import { Button } from "@/components/ui/button";
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";
import type { InvestmentPortfolioSettingsDialog3Props } from "@/lib/interfaces/render/investment-portfolio-settings-investment-portfolio-settings-dialog3";

export function InvestmentPortfolioSettingsDialog3({ isReconcileOpen, setIsReconcileOpen, reconciledBalance, setReconciledBalance, reconciledDate, setReconciledDate, isPending, startTransition, onReconcile }: InvestmentPortfolioSettingsDialog3Props) {
  return (
<Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className="border-border bg-card text-content-strong sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Conferir saldo real</DialogTitle>
            <DialogDescription className="leading-6 text-content">
              Use o valor exibido pela corretora. Esse valor passa a ser a nova base para os
              rendimentos futuros e incorpora os movimentos anteriores à data escolhida.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <InvestmentField monetary
              id="investment-reconciled-balance"
              label="Saldo real"
              value={reconciledBalance}
              placeholder="0,00"
              onChange={setReconciledBalance}
            />
            <InvestmentField
              id="investment-reconciled-date"
              label="Data da conferência"
              type="date"
              value={reconciledDate}
              onChange={setReconciledDate}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReconcileOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isPending || !reconciledBalance || !reconciledDate}
              onClick={() => startTransition(() => void onReconcile())}
            >
              {isPending ? "Conferindo..." : "Salvar checkpoint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
