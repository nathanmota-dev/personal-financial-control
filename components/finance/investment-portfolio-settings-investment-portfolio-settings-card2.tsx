"use client";

import { InvestmentField } from "@/components/finance/investment-field";
import { Button } from "@/components/ui/button";
import { centsToMoneyInput, formatRateFromBps } from "@/lib/finance-ui";
import type { InvestmentPortfolioSettingsCard2Props } from "@/lib/interfaces/render/investment-portfolio-settings-investment-portfolio-settings-card2";
import { RefreshCcw,Save } from "lucide-react";

export function InvestmentPortfolioSettingsCard2({ projection, rate, setRate, isPending, startTransition, onUpdateRate, setReconciledBalance, setReconciledDate, setIsReconcileOpen }: InvestmentPortfolioSettingsCard2Props) {
  return (
<section className="flex min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
        <h2 className="text-lg font-semibold leading-[25px]">Premissas e conferência</h2>
        <p className="mt-1 text-xs text-content-muted">
          O saldo é estimado diariamente. Use a conferência quando o valor real da corretora
          divergir da taxa modelada.
        </p>
        <div className="mt-5 grid gap-5">
          <div className="space-y-2">
          <InvestmentField
            id="investment-expected-rate"
            label="Taxa mensal esperada (%)"
            value={rate}
            placeholder="1,00"
            onChange={setRate}
          />
          <p className="text-[11px] leading-4 text-content-subtle">
            A taxa atual é {formatRateFromBps(projection.expectedMonthlyRateBps)} e serve para
            estimar o rendimento entre movimentações.
          </p>
          </div>
          <div className="flex flex-wrap gap-2.5 border-t border-border pt-4">
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
        </div>
      </section>
  );
}
