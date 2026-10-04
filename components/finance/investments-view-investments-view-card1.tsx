"use client";

import { financePanelClassName } from "@/components/finance/finance-styles";
import { Button } from "@/components/ui/button";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Popover,PopoverContent,PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency } from "@/lib/finance-ui";
import type { InvestmentsViewCard1Props } from "@/lib/interfaces/render/investments-view-investments-view-card1";
import { cn } from "@/lib/utils";
import { SIMULATION_MONTH_LABELS,formatSimulationMonth } from "@/lib/utils/components/investments-view";
import { CalendarDays } from "lucide-react";

export function InvestmentsViewCard1({ isSimulationPickerOpen, setIsSimulationPickerOpen, projection, selectedSimulationDate, applySimulation, minSimulationMonth, maxSimulationMonth, simulatedMonths, simulatedValue }: InvestmentsViewCard1Props) {
  return (
<Card className={cn(financePanelClassName, "h-full")}>
          <CardHeader>
            <CardTitle>Simular período</CardTitle>
            <p className="text-sm leading-6 text-content">
              Escolha um mês futuro para testar o efeito da taxa e dos movimentos previstos.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-content-strong">Data final da simulação</p>
              <Popover open={isSimulationPickerOpen} onOpenChange={setIsSimulationPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between border-input bg-card text-content-strong hover:bg-surface-raised"
                    disabled={!projection}
                  >
                    <span>
                      {selectedSimulationDate
                        ? formatSimulationMonth(selectedSimulationDate)
                        : "Selecione um mês"}
                    </span>
                    <CalendarDays className="size-4 text-content" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-auto overflow-hidden rounded-[20px] border border-border bg-card p-0 text-content-strong shadow-none"
                >
                  <MonthPicker
                    selectedMonth={selectedSimulationDate}
                    onMonthSelect={applySimulation}
                    minDate={minSimulationMonth}
                    maxDate={maxSimulationMonth}
                    callbacks={{
                      monthLabel: (month) => SIMULATION_MONTH_LABELS[month.number],
                    }}
                    variant={{
                      calendar: { main: "ghost", selected: "secondary" },
                      chevrons: "ghost",
                    }}
                    className="text-content-strong"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {projection ? (
              simulatedMonths && simulatedValue !== null ? (
                <div className="rounded-[20px] border border-brand/20 bg-muted/30 p-5">
                  <p className="text-sm font-medium text-brand/80">
                    Valor projetado
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-brand">
                    {formatCurrency(simulatedValue)}
                  </p>
                  <p className="mt-2 text-sm text-content">
                    Até {selectedSimulationDate ? formatSimulationMonth(selectedSimulationDate) : "o período escolhido"}, com os lançamentos previstos.
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-content">
                  Selecione um mês futuro para gerar a projeção personalizada.
                </p>
              )
            ) : (
              <p className="text-sm leading-6 text-content">
                Configure a carteira acima para liberar a simulação personalizada.
              </p>
            )}
          </CardContent>
        </Card>
  );
}
