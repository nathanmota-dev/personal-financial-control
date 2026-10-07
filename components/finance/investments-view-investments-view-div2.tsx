"use client";

import { financePanelClassName } from "@/components/finance/finance-styles";
import { InvestmentContributionChart } from "@/components/finance/investment-contribution-chart";
import { InvestmentGrowthChart } from "@/components/finance/investment-growth-chart";
import { InvestmentPortfolioSettings } from "@/components/finance/investment-portfolio-settings";
import { InvestmentsViewCard1 } from "@/components/finance/investments-view-investments-view-card1";
import { InvestmentsViewSection1 } from "@/components/finance/investments-view-investments-view-section1";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import type { InvestmentsViewDiv2Props } from "@/lib/interfaces/render/investments-view-investments-view-div2";
import { cn } from "@/lib/utils";
import { formatSimulationMonth } from "@/lib/utils/components/investments-view";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function InvestmentsViewDiv2({ projection, contributionHistory, cards, isSimulationPickerOpen, setIsSimulationPickerOpen, selectedSimulationDate, applySimulation, minSimulationMonth, maxSimulationMonth, simulatedMonths, simulatedValue }: InvestmentsViewDiv2Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
<div className="space-y-6">
      <PageHeader
        eyebrow="Investimentos"
        title="Reserva de emergência"
        description="Acompanhe o saldo estimado, confira o valor real quando necessário e projete o crescimento com base nos lançamentos da sua vida financeira."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/investments/portfolio">
                Carteira de longo prazo
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/transactions?type=investment_contribution">
                Ver aportes
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/recurring">
                Configurar recorrência
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <InvestmentsViewSection1 projection={projection} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <InvestmentPortfolioSettings projection={projection} />
        <InvestmentContributionChart history={contributionHistory} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className={cn(financePanelClassName, "h-full")}>
          <CardHeader>
            <CardTitle>Projeções com seus lançamentos</CardTitle>
            <p className="text-sm leading-6 text-content">
              O cálculo parte do saldo estimado de hoje e inclui recorrências e lançamentos futuros.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {projection ? (
              cards.map((card) => (
                <div
                  key={card.months}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <p className="text-sm text-content">
                    {card.months} {card.months === 1 ? "mês" : "meses"}
                  </p>
                  <p className="mt-2 text-[27px] font-[650] tracking-[-0.8px] text-content-strong">
                    {formatCurrency(card.value ?? 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-content sm:col-span-2">
                Configure a carteira para visualizar as projeções.
              </p>
            )}
          </CardContent>
        </Card>

        <InvestmentsViewCard1 isSimulationPickerOpen={isSimulationPickerOpen} setIsSimulationPickerOpen={setIsSimulationPickerOpen} projection={projection} selectedSimulationDate={selectedSimulationDate} applySimulation={applySimulation} minSimulationMonth={minSimulationMonth} maxSimulationMonth={maxSimulationMonth} simulatedMonths={simulatedMonths} simulatedValue={simulatedValue} />
      </div>

      {projection && simulatedMonths && selectedSimulationDate ? (
        <InvestmentGrowthChart
          currentBalanceCents={projection.currentBalanceCents}
          expectedMonthlyRateBps={projection.expectedMonthlyRateBps}
          referenceDate={projection.asOfDate}
          movements={projection.plannedMovements}
          months={simulatedMonths}
          periodLabel={formatSimulationMonth(selectedSimulationDate)}
        />
      ) : null}
    </div>
  );
}
