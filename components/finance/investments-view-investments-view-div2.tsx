"use client";

import { InvestmentContributionChart } from "@/components/finance/investment-contribution-chart";
import { InvestmentGrowthChart } from "@/components/finance/investment-growth-chart";
import { InvestmentMovementList } from "@/components/finance/investment-movement-list";
import { InvestmentsViewCard1 } from "@/components/finance/investments-view-investments-view-card1";
import { InvestmentsViewSection1 } from "@/components/finance/investments-view-investments-view-section1";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import type { InvestmentsViewDiv2Props } from "@/lib/interfaces/render/investments-view-investments-view-div2";
import { formatSimulationMonth } from "@/lib/utils/components/investments-view";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const headerButtonClassName = "h-10 gap-[10px] rounded-[10px] text-[13px] font-medium";
const gridClassName = "grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]";

export function InvestmentsViewDiv2({ projection, contributionHistory, cards, isSimulationPickerOpen, setIsSimulationPickerOpen, selectedSimulationDate, applySimulation, minSimulationMonth, maxSimulationMonth, simulatedMonths, simulatedValue }: InvestmentsViewDiv2Props) {
  return (
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Reserva"
        title="Reserva"
        description={projection?.source === "bank" ? "Acompanhe a parte das suas posições definida como reserva, com o valor e a rentabilidade reais do banco, e projete o crescimento." : "Acompanhe o saldo estimado e projete o crescimento com base nos lançamentos da sua vida financeira. O saldo e a taxa ficam em Configurações."}
        actions={
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" className={headerButtonClassName}>
              <Link href="/investments/portfolio">
                Carteira
                <ArrowRight className="size-[17px]" />
              </Link>
            </Button>
            <Button asChild variant="secondary" className={headerButtonClassName}>
              <Link href="/transactions?type=investment_contribution">
                Ver aportes
                <ArrowRight className="size-[17px]" />
              </Link>
            </Button>
            <Button asChild className={headerButtonClassName}>
              <Link href="/recurring">
                Configurar recorrência
                <ArrowRight className="size-[17px]" />
              </Link>
            </Button>
          </div>
        }
      />

      <div className={gridClassName}>
        <InvestmentsViewSection1 projection={projection} />
        <InvestmentsViewCard1 isSimulationPickerOpen={isSimulationPickerOpen} setIsSimulationPickerOpen={setIsSimulationPickerOpen} projection={projection} cards={cards} selectedSimulationDate={selectedSimulationDate} applySimulation={applySimulation} minSimulationMonth={minSimulationMonth} maxSimulationMonth={maxSimulationMonth} simulatedMonths={simulatedMonths} simulatedValue={simulatedValue} />
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

      <div className={gridClassName}>
        <InvestmentContributionChart history={contributionHistory} />
        <InvestmentMovementList history={contributionHistory} />
      </div>
    </div>
  );
}
