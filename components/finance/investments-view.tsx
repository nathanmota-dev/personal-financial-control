"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMonths, addYears, differenceInCalendarMonths, startOfMonth } from "date-fns";
import { Calculator, CalendarDays, PiggyBank, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { saveInvestmentPortfolioAction } from "@/app/actions/finance";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  centsToMoneyInput,
  extractErrorMessage,
  formatCurrency,
  formatRateFromBps,
  moneyInputToCents,
} from "@/lib/finance-ui";
import { projectCompoundBalance } from "@/lib/investment-projection";
import { cn } from "@/lib/utils";

type Projection = {
  id: string;
  currentBalanceCents: number;
  monthlyContributionCents: number;
  expectedMonthlyRateBps: number;
  referenceDate: string;
  projection: Record<number, number>;
} | null;

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

function formatSimulationMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function InvestmentsView({
  projection,
}: {
  projection: Projection;
}) {
  const currentMonth = startOfMonth(new Date());
  const minSimulationMonth = addMonths(currentMonth, 1);
  const maxSimulationMonth = addYears(currentMonth, 50);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSimulationPickerOpen, setIsSimulationPickerOpen] = useState(false);
  const [selectedSimulationDate, setSelectedSimulationDate] = useState<Date | undefined>();
  const [simulatedMonths, setSimulatedMonths] = useState<number | null>(null);
  const [form, setForm] = useState({
    currentBalance: projection ? centsToMoneyInput(projection.currentBalanceCents) : "0,00",
    monthlyContribution: projection ? centsToMoneyInput(projection.monthlyContributionCents) : "0,00",
    expectedMonthlyRate: projection ? (projection.expectedMonthlyRateBps / 100).toFixed(2).replace(".", ",") : "1,00",
    referenceDate: projection?.referenceDate ?? new Date().toISOString().slice(0, 10),
  });

  async function onSubmit() {
    try {
      await saveInvestmentPortfolioAction({
        currentBalanceCents: moneyInputToCents(form.currentBalance),
        monthlyContributionCents: moneyInputToCents(form.monthlyContribution),
        expectedMonthlyRateBps: Math.round(Number(form.expectedMonthlyRate.replace(",", ".")) * 100),
        referenceDate: form.referenceDate,
      });
      toast.success("Carteira salva.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  const cards = [1, 6, 12, 24].map((months) => ({
    months,
    value: projection?.projection[months] ?? null,
  }));

  const simulatedValue =
    projection && simulatedMonths
      ? projectCompoundBalance({
          currentBalanceCents: projection.currentBalanceCents,
          monthlyContributionCents: projection.monthlyContributionCents,
          expectedMonthlyRateBps: projection.expectedMonthlyRateBps,
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

    const normalized = differenceInCalendarMonths(
      normalizedDate,
      currentMonth
    );

    if (normalized > 0) {
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
        description="Se a leitura ainda falhar, a página abre vazia e permite salvar a carteira inicial do zero."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={<PiggyBank className="size-5" />}
          label="Saldo atual"
          value={projection ? formatCurrency(projection.currentBalanceCents) : "R$ 0,00"}
          accent="cyan"
        />
        <InfoCard
          icon={<TrendingUp className="size-5" />}
          label="Aporte mensal"
          value={projection ? formatCurrency(projection.monthlyContributionCents) : "R$ 0,00"}
          accent="sky"
        />
        <InfoCard
          icon={<Calculator className="size-5" />}
          label="Taxa mensal esperada"
          value={projection ? formatRateFromBps(projection.expectedMonthlyRateBps) : "1,00% a.m."}
          accent="blue"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Atualizar carteira</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <LabeledInput
              id="investment-current-balance"
              label="Saldo atual"
              value={form.currentBalance}
              placeholder="0,00"
              onChange={(event) =>
                setForm((state) => ({ ...state, currentBalance: event.target.value }))
              }
            />
            <LabeledInput
              id="investment-monthly-contribution"
              label="Aporte mensal"
              value={form.monthlyContribution}
              placeholder="0,00"
              onChange={(event) =>
                setForm((state) => ({ ...state, monthlyContribution: event.target.value }))
              }
            />
            <LabeledInput
              id="investment-expected-rate"
              label="Taxa mensal esperada"
              value={form.expectedMonthlyRate}
              placeholder="0,00"
              onChange={(event) =>
                setForm((state) => ({ ...state, expectedMonthlyRate: event.target.value }))
              }
            />
            <LabeledInput
              id="investment-reference-date"
              label="Data de referência"
              type="date"
              value={form.referenceDate}
              onChange={(event) =>
                setForm((state) => ({ ...state, referenceDate: event.target.value }))
              }
            />
            <Button disabled={isPending} onClick={() => startTransition(() => void onSubmit())}>
              {isPending ? "Salvando..." : "Salvar carteira"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-[1.75rem] border-slate-800 bg-[#06152d] text-white">
            <CardHeader>
            <CardTitle>Simular período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-100">Data final da simulação</Label>
              <Popover open={isSimulationPickerOpen} onOpenChange={setIsSimulationPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
                  >
                    <span>
                      {selectedSimulationDate
                        ? formatSimulationMonth(selectedSimulationDate)
                        : "Selecionar mês"}
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
                      calendar: {
                        main: "ghost",
                        selected: "secondary",
                      },
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
                      {selectedSimulationDate
                        ? `Até ${formatSimulationMonth(selectedSimulationDate)}, total de ${simulatedMonths} ${
                            simulatedMonths === 1 ? "mês" : "meses"
                          }.`
                        : null}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-300">
                    Selecione um mês futuro para gerar a projeção personalizada.
                  </p>
                )
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  Salve a carteira acima para liberar a simulação personalizada.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Projeções fixas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
                <p className="text-sm text-slate-400">
                  Salve a carteira acima para visualizar as projeções fixas de 1, 6, 12 e 24 meses.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "cyan" | "sky" | "blue";
}) {
  const styles = {
    cyan: "text-cyan-300 bg-cyan-500/12",
    sky: "text-sky-300 bg-sky-500/12",
    blue: "text-blue-300 bg-blue-500/12",
  } as const;

  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-2 pt-4">
        <div className={cn("inline-flex rounded-full p-2", styles[accent])}>{icon}</div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="font-heading text-3xl font-semibold tracking-tight text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}

function LabeledInput({
  id,
  label,
  ...props
}: React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
}) {
  const fallbackId = useId();
  const inputId = id || fallbackId;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-slate-200">
        {label}
      </Label>
      <Input id={inputId} {...props} />
    </div>
  );
}
