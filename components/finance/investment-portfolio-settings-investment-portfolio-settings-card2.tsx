"use client";

import { financeIconClassName } from "@/components/finance/finance-styles";
import { InvestmentField } from "@/components/finance/investment-field";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { centsToMoneyInput, formatDateLabel, formatRateFromBps } from "@/lib/finance-ui";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { InvestmentPortfolioSettingsCard2Props } from "@/lib/interfaces/render/investment-portfolio-settings-investment-portfolio-settings-card2";
import { cn } from "@/lib/utils";
import { RefreshCcw,Save,SlidersHorizontal } from "lucide-react";

export function InvestmentPortfolioSettingsCard2({ projection, rate, setRate, isPending, startTransition, onUpdateRate, setReconciledBalance, setReconciledDate, setIsReconcileOpen }: InvestmentPortfolioSettingsCard2Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<Card className="h-full rounded-xl border-border bg-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Premissas e conferência</CardTitle>
              <p className="mt-2 text-sm leading-6 text-content">
                O saldo é estimado diariamente. Use a conferência quando o valor real da corretora
                divergir da taxa modelada.
              </p>
            </div>
            <div className={cn(financeIconClassName, "bg-brand/10 text-brand")}>
              <SlidersHorizontal className="size-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-content">Checkpoint</p>
              <p className="mt-1 font-semibold text-content-strong">
                {formatCurrency(projection.checkpointBalanceCents)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-content">Data</p>
              <p className="mt-1 font-semibold text-content-strong">
                {formatDateLabel(projection.checkpointDate)}
              </p>
            </div>
          </div>
          <InvestmentField
            id="investment-expected-rate"
            label="Taxa mensal esperada (%)"
            value={rate}
            placeholder="1,00"
            onChange={setRate}
          />
          <p className="text-xs leading-5 text-content">
            A taxa atual é {formatRateFromBps(projection.expectedMonthlyRateBps)} e serve para
            estimar o rendimento entre movimentações.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => startTransition(() => void onUpdateRate())}
            >
              <Save className="size-4" />
              {isPending ? "Salvando..." : "Salvar taxa"}
            </Button>
            <Button
              disabled={isPending}
              onClick={() => {
                setReconciledBalance(centsToMoneyInput(projection.currentBalanceCents));
                setReconciledDate(projection.asOfDate);
                setIsReconcileOpen(true);
              }}
            >
              <RefreshCcw className="size-4" />
              Conferir saldo real
            </Button>
          </div>
        </CardContent>
      </Card>
  );
}
