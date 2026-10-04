"use client";

import { InvestmentField } from "@/components/finance/investment-field";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import type { InvestmentPortfolioSettingsCard1Props } from "@/lib/interfaces/render/investment-portfolio-settings-investment-portfolio-settings-card1";
import { Save } from "lucide-react";

export function InvestmentPortfolioSettingsCard1({ initialBalance, setInitialBalance, initialDate, setInitialDate, rate, setRate, isPending, startTransition, onConfigure }: InvestmentPortfolioSettingsCard1Props) {
  return (
<Card className="h-full rounded-xl border-border bg-card">
        <CardHeader>
          <CardTitle>Configurar carteira</CardTitle>
          <p className="text-sm leading-6 text-content">
            Informe o primeiro saldo real. A partir dele, a carteira será atualizada pela taxa
            esperada e pelos lançamentos realizados.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
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
            {isPending ? "Salvando..." : "Configurar carteira"}
          </Button>
        </CardContent>
      </Card>
  );
}
