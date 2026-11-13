"use client";

import { CalendarDays } from "lucide-react";

import { DashboardCardIllustration } from "@/components/finance/dashboard-card-illustration";
import { DashboardCardsMoney } from "@/components/finance/dashboard-cards-money";
import { useFinancialFormatter } from "@/components/finance/privacy/privacy-context";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReserveContributionForm } from "@/components/finance/reserve-contribution-form";
import type { InvestmentsViewCard1Props } from "@/lib/interfaces/render/investments-view-investments-view-card1";
import { SIMULATION_MONTH_LABELS, formatSimulationMonth } from "@/lib/utils/components/investments-view";

export function InvestmentsViewCard1({ isSimulationPickerOpen, setIsSimulationPickerOpen, projection, cards, selectedSimulationDate, applySimulation, minSimulationMonth, maxSimulationMonth, simulatedMonths, simulatedValue }: InvestmentsViewCard1Props) {
  const { formatCurrency } = useFinancialFormatter();
  return (
    <section className="relative flex min-w-0 flex-col rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
      <DashboardCardIllustration src="/images/projected-balance-trend.webp" />
      <h2 className="text-lg font-semibold leading-[25px]">Projeções da reserva</h2>
      <p className="mt-1 pr-16 text-xs text-content-muted">{projection?.source === "bank" ? "Saldo esperado com a rentabilidade real e o aporte mensal da reserva" : "Saldo esperado com a taxa e o aporte mensal da reserva"}</p>
      {projection ? (
        <ul className="mt-4 divide-y divide-border">
          {cards.map((card) => (
            <li key={card.months} className="flex items-center justify-between gap-3 py-3 text-[13px]">
              <span className="text-content">{`Em ${card.months} ${card.months === 1 ? "mês" : "meses"}`}</span>
              <span className="font-semibold tabular-nums text-content-strong">{formatCurrency(card.value ?? 0)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] leading-5 text-content">Configure a reserva para visualizar as projeções.</p>
      )}
      {projection ? <ReserveContributionForm key={`${projection.contribution.source}-${projection.contribution.monthlyCents}`} contribution={projection.contribution} /> : null}

      <h3 className="mt-6 text-[10px] font-bold tracking-wider text-content uppercase">Simular período</h3>
      <div className="mt-2 space-y-3">
        <Popover open={isSimulationPickerOpen} onOpenChange={setIsSimulationPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-between rounded-[10px] border-input bg-card text-[13px] text-content-strong hover:bg-muted"
              disabled={!projection}
            >
              <span>{selectedSimulationDate ? formatSimulationMonth(selectedSimulationDate) : "Selecione um mês"}</span>
              <CalendarDays className="size-4 text-content" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto overflow-hidden rounded-[20px] border border-border bg-card p-0 text-content-strong shadow-none">
            <MonthPicker
              selectedMonth={selectedSimulationDate}
              onMonthSelect={applySimulation}
              minDate={minSimulationMonth}
              maxDate={maxSimulationMonth}
              callbacks={{ monthLabel: (month) => SIMULATION_MONTH_LABELS[month.number] }}
              variant={{ calendar: { main: "ghost", selected: "secondary" }, chevrons: "ghost" }}
              className="text-content-strong"
            />
          </PopoverContent>
        </Popover>

        {projection && simulatedMonths && simulatedValue !== null ? (
          <div>
            <p className="text-xs text-content">Valor projetado</p>
            <DashboardCardsMoney cents={simulatedValue} className="mt-1 block text-[32px] leading-[38px] font-bold text-content-strong" />
            <p className="mt-1 text-[11px] text-content-subtle">
              Até {selectedSimulationDate ? formatSimulationMonth(selectedSimulationDate) : "o período escolhido"}, com os lançamentos previstos.
            </p>
          </div>
        ) : (
          <p className="text-xs leading-5 text-content-muted">
            {projection ? "Selecione um mês futuro para gerar a projeção personalizada." : "Configure a reserva para liberar a simulação."}
          </p>
        )}
      </div>
    </section>
  );
}
