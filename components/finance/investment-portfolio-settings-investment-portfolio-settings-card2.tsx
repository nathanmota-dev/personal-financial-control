"use client";

import { IconTile } from "@/components/finance/ds/icon-tile";

import { InvestmentField } from "@/components/finance/investment-field";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { centsToMoneyInput, formatRateFromBps } from "@/lib/finance-ui";
import type { InvestmentPortfolioSettingsCard2Props } from "@/lib/interfaces/render/investment-portfolio-settings-investment-portfolio-settings-card2";
import { RefreshCcw,Save,SlidersHorizontal } from "lucide-react";

export function InvestmentPortfolioSettingsCard2({ projection, rate, setRate, isPending, startTransition, onUpdateRate, setReconciledBalance, setReconciledDate, setIsReconcileOpen }: InvestmentPortfolioSettingsCard2Props) {
  return (
<Card className="gap-0 py-0">
        <CardHeader className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <IconTile tone="brand" size="sm"><SlidersHorizontal /></IconTile>
            <div>
              <CardTitle className="text-base">Premissas e conferência</CardTitle>
              <p className="text-xs leading-5 text-content-muted">
                O saldo é estimado diariamente. Use a conferência quando o valor real da corretora
                divergir da taxa modelada.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid items-end gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
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
          </div>
          <div className="flex flex-wrap gap-2.5">
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
