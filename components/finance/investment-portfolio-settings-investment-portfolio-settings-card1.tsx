"use client";

import { InvestmentField } from "@/components/finance/investment-field";
import { Button } from "@/components/ui/button";
import type { InvestmentPortfolioSettingsCard1Props } from "@/lib/interfaces/render/investment-portfolio-settings-investment-portfolio-settings-card1";
import { Save } from "lucide-react";

export function InvestmentPortfolioSettingsCard1({ initialBalance, setInitialBalance, initialDate, setInitialDate, rate, setRate, isPending, startTransition, onConfigure }: InvestmentPortfolioSettingsCard1Props) {
  return (
<section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
        <h2 className="text-lg font-semibold leading-[25px]">Configurar reserva</h2>
        <p className="mt-1 text-xs text-content-muted">
          Informe o primeiro saldo real. A partir dele, a reserva será atualizada pela taxa
          esperada e pelos lançamentos realizados.
        </p>
        <div className="mt-5 grid gap-4">
          <InvestmentField monetary
            id="investment-initial-balance"
            label="Saldo real no checkpoint"
            value={initialBalance}
            placeholder="0,00"
            onChange={setInitialBalance}
          />
          <InvestmentField
            id="investment-initial-date"
            label="Data do checkpoint"
            type="date"
            value={initialDate}
            onChange={setInitialDate}
          />
          <InvestmentField
            id="investment-expected-rate"
            label="Taxa mensal esperada (%)"
            value={rate}
            placeholder="1,00"
            onChange={setRate}
          />
          <Button
            disabled={isPending || !initialDate || !initialBalance}
            onClick={() => startTransition(() => void onConfigure())}
          >
            <Save className="size-4" />
            {isPending ? "Salvando..." : "Configurar reserva"}
          </Button>
        </div>
      </section>
  );
}
