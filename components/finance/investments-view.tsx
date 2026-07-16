"use client";

import { useState } from "react";
import Link from "next/link";
import { addMonths, addYears, differenceInCalendarMonths, startOfMonth } from "date-fns";
import { ArrowRight, CalendarDays, Calculator, PiggyBank, TrendingUp } from "lucide-react";

import { InvestmentContributionChart } from "@/components/finance/investment-contribution-chart";
import { InvestmentGrowthChart } from "@/components/finance/investment-growth-chart";
import { InvestmentPortfolioSettings } from "@/components/finance/investment-portfolio-settings";
import { InvestmentSummaryCard } from "@/components/finance/investment-summary-card";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { InvestmentsViewProps } from "@/lib/interfaces/investments";
import { formatCurrency, formatDateLabel, formatRateFromBps } from "@/lib/finance-ui";
import { projectCompoundBalance } from "@/lib/investment-projection";

const SIMULATION_MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export function InvestmentsView({
  projection,
  contributionHistory,
}: InvestmentsViewProps) {
  const today = new Date();
  const currentMonth = startOfMonth(today);
  const referenceDate = projection ? parseDate(projection.asOfDate) : today;
  const referenceMonth = startOfMonth(referenceDate);
  const earliestFutureMonth = addMonths(currentMonth, 1);
  const firstMonthAfterReference = addMonths(referenceMonth, 1);
  const minSimulationMonth =
    firstMonthAfterReference > earliestFutureMonth
      ? firstMonthAfterReference
      : earliestFutureMonth;
  const maxSimulationMonth = addYears(minSimulationMonth, 50);
  const defaultSimulationDate = getDefaultSimulationDate(today, minSimulationMonth);
  const defaultSimulatedMonths = getSimulationMonthCount(
    defaultSimulationDate,
    referenceMonth
  );
  const [isSimulationPickerOpen, setIsSimulationPickerOpen] = useState(false);
  const [selectedSimulationDate, setSelectedSimulationDate] = useState<Date | undefined>(
    projection ? defaultSimulationDate : undefined
  );
  const [simulatedMonths, setSimulatedMonths] = useState<number | null>(
    projection ? defaultSimulatedMonths : null
  );

  const cards = [1, 6, 12, 24].map((months) => ({
    months,
    value: projection?.projection[months] ?? null,
  }));
  const simulatedValue =
    projection && simulatedMonths
      ? projectCompoundBalance({
          currentBalanceCents: projection.currentBalanceCents,
          expectedMonthlyRateBps: projection.expectedMonthlyRateBps,
          referenceDate: projection.asOfDate,
          movements: projection.plannedMovements,
          months: simulatedMonths,
        })
      : null;

  function applySimulation(date?: Date) {
    const normalizedDate = date ? startOfMonth(date) : undefined;
    setSelectedSimulationDate(normalizedDate);

    if (!normalizedDate) {
      setSimulatedMonths(null);
      return;
    }

    const normalized = getSimulationMonthCount(normalizedDate, referenceMonth);

    if (normalized > 1) {
      setSimulatedMonths(normalized);
      setIsSimulationPickerOpen(false);
      return;
    }

    setSimulatedMonths(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investimentos"
        title="Carteira consolidada e simulador"
        description="Acompanhe o saldo estimado, confira o valor real quando necessário e projete o crescimento com base nos lançamentos da sua vida financeira."
        actions={
          <div className="flex flex-wrap gap-2">
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

      <section className="grid gap-4 md:grid-cols-3">
        <InvestmentSummaryCard
          icon={<PiggyBank className="size-5" />}
          label="Saldo estimado hoje"
          value={projection ? formatCurrency(projection.currentBalanceCents) : "R$ 0,00"}
          detail={
            projection
              ? `Conferido em ${formatDateLabel(projection.checkpointDate)}`
              : "Configure o primeiro checkpoint real."
          }
          tone="cyan"
        />
        <InvestmentSummaryCard
          icon={<TrendingUp className="size-5" />}
          label="Rendimento estimado"
          value={projection ? formatCurrency(projection.estimatedInterestCents) : "R$ 0,00"}
          detail={
            projection
              ? `Desde ${formatDateLabel(projection.checkpointDate)}`
              : "Calculado entre checkpoints."
          }
          tone="amber"
        />
        <InvestmentSummaryCard
          icon={<Calculator className="size-5" />}
          label="Próximo aporte previsto"
          value={projection?.nextContributionDate ? formatDateLabel(projection.nextContributionDate) : "Nenhum"}
          detail={
            projection
              ? `Taxa de ${formatRateFromBps(projection.expectedMonthlyRateBps)}`
              : "Use uma recorrência para planejar."
          }
          tone="sky"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <InvestmentPortfolioSettings projection={projection} />
        <InvestmentContributionChart history={contributionHistory} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="h-full rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Projeções com seus lançamentos</CardTitle>
            <p className="text-sm leading-6 text-slate-400">
              O cálculo parte do saldo estimado de hoje e inclui recorrências e lançamentos futuros.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {projection ? (
              cards.map((card) => (
                <div
                  key={card.months}
                  className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4"
                >
                  <p className="text-sm text-slate-400">
                    {card.months} {card.months === 1 ? "mês" : "meses"}
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-cyan-300">
                    {formatCurrency(card.value ?? 0)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 sm:col-span-2">
                Configure a carteira para visualizar as projeções.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="h-full rounded-[1.75rem] border-slate-800 bg-[#06152d] text-white">
          <CardHeader>
            <CardTitle>Simular período</CardTitle>
            <p className="text-sm leading-6 text-slate-300">
              Escolha um mês futuro para testar o efeito da taxa e dos movimentos previstos.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-100">Data final da simulação</p>
              <Popover open={isSimulationPickerOpen} onOpenChange={setIsSimulationPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
                    disabled={!projection}
                  >
                    <span>
                      {selectedSimulationDate
                        ? formatSimulationMonth(selectedSimulationDate)
                        : "Selecione um mês"}
                    </span>
                    <CalendarDays className="size-4 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-auto overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950/95 p-0 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]"
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
                    className="text-slate-100"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {projection ? (
              simulatedMonths && simulatedValue !== null ? (
                <div className="rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/55 p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/80">
                    Valor projetado
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-cyan-300">
                    {formatCurrency(simulatedValue)}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    Até {selectedSimulationDate ? formatSimulationMonth(selectedSimulationDate) : "o período escolhido"}, com os lançamentos previstos.
                  </p>
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  Selecione um mês futuro para gerar a projeção personalizada.
                </p>
              )
            ) : (
              <p className="text-sm leading-6 text-slate-300">
                Configure a carteira acima para liberar a simulação personalizada.
              </p>
            )}
          </CardContent>
        </Card>
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

function formatSimulationMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function getDefaultSimulationDate(currentDate: Date, minimumDate: Date) {
  const monthInOneYear = addMonths(startOfMonth(currentDate), 12);

  return monthInOneYear > minimumDate ? monthInOneYear : minimumDate;
}

function getSimulationMonthCount(date: Date, referenceMonth: Date) {
  return differenceInCalendarMonths(startOfMonth(date), referenceMonth) + 1;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}
