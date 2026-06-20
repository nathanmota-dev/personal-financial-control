"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMonths, addYears, differenceInCalendarMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calculator, CalendarDays, PiggyBank, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import {
  createInvestmentContributionAction,
  saveInvestmentPortfolioAction,
} from "@/app/actions/finance";
import { InvestmentContributionChart } from "@/components/finance/investment-contribution-chart";
import { InvestmentGrowthChart } from "@/components/finance/investment-growth-chart";
import { PageHeader } from "@/components/finance/page-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/monthpicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  unincorporatedContributionCents: number;
  projection: Record<number, number>;
} | null;

type ContributionHistory = {
  totalContributionCents: number;
  points: Array<{
    month: string;
    monthlyContributionCents: number;
    cumulativeContributionCents: number;
  }>;
};

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
};

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

const SELECT_TRIGGER_CLASSNAME =
  "h-10 w-full rounded-xl border-slate-700 bg-slate-950/70 text-slate-100 focus-visible:border-cyan-400/70 focus-visible:ring-cyan-400/20";
const SELECT_CONTENT_CLASSNAME =
  "rounded-[1.25rem] border-slate-800 bg-slate-950/96 p-1 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]";
const SELECT_ITEM_CLASSNAME =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-slate-200 focus:bg-slate-800 focus:text-slate-50 data-[state=checked]:bg-slate-800/90";

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

function parseReferenceDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function buildReferenceDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatReferenceDateLabel(date: string) {
  const parsedDate = parseReferenceDate(date);

  if (!parsedDate) {
    return "Selecionar data";
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function InvestmentsView({
  projection,
  contributionHistory,
  sourceAccounts,
  investmentCategories,
}: {
  projection: Projection;
  contributionHistory: ContributionHistory;
  sourceAccounts: AccountOption[];
  investmentCategories: CategoryOption[];
}) {
  const today = new Date();
  const currentMonth = startOfMonth(today);
  const projectionReferenceDate = projection
    ? parseReferenceDate(projection.referenceDate)
    : undefined;
  const referenceMonth = startOfMonth(projectionReferenceDate ?? today);
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isReferenceDatePickerOpen, setIsReferenceDatePickerOpen] = useState(false);
  const [isSimulationPickerOpen, setIsSimulationPickerOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [selectedSimulationDate, setSelectedSimulationDate] = useState<Date | undefined>(
    defaultSimulationDate
  );
  const [simulatedMonths, setSimulatedMonths] = useState<number | null>(
    defaultSimulatedMonths
  );
  const [form, setForm] = useState({
    currentBalance: projection ? centsToMoneyInput(projection.currentBalanceCents) : "0,00",
    monthlyContribution: projection
      ? centsToMoneyInput(projection.monthlyContributionCents)
      : "0,00",
    expectedMonthlyRate: projection
      ? (projection.expectedMonthlyRateBps / 100).toFixed(2).replace(".", ",")
      : "1,00",
    referenceDate: projection?.referenceDate ?? buildReferenceDate(today),
  });
  const [contributionForm, setContributionForm] = useState({
    amount: "",
    transactionDate: buildReferenceDate(today),
    accountId: sourceAccounts[0]?.id ?? "",
    categoryId: investmentCategories[0]?.id ?? "",
  });

  const canRegisterContribution = Boolean(
    projection && sourceAccounts.length && investmentCategories.length
  );

  async function onSavePortfolio() {
    try {
      await saveInvestmentPortfolioAction({
        currentBalanceCents: moneyInputToCents(form.currentBalance),
        monthlyContributionCents: moneyInputToCents(form.monthlyContribution),
        expectedMonthlyRateBps: Math.round(
          Number(form.expectedMonthlyRate.replace(",", ".")) * 100
        ),
        referenceDate: form.referenceDate,
      });
      toast.success("Carteira salva e aportes consolidados.");
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  async function onCreateContribution() {
    try {
      await createInvestmentContributionAction({
        accountId: contributionForm.accountId,
        categoryId: contributionForm.categoryId,
        amountCents: moneyInputToCents(contributionForm.amount),
        transactionDate: contributionForm.transactionDate,
      });
      setContributionForm((state) => ({ ...state, amount: "" }));
      setIsContributionDialogOpen(false);
      toast.success("Aporte registrado.");
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
          referenceDate: projection.referenceDate,
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
        description="Registre cada aporte sem reescrever o saldo e projete o crescimento a partir da data real da carteira."
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
          label="Aporte mensal previsto"
          value={
            projection ? formatCurrency(projection.monthlyContributionCents) : "R$ 0,00"
          }
          accent="sky"
        />
        <InfoCard
          icon={<Calculator className="size-5" />}
          label="Taxa mensal esperada"
          value={
            projection
              ? formatRateFromBps(projection.expectedMonthlyRateBps)
              : "1,00% a.m."
          }
          accent="blue"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <Card className="h-full rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Atualizar carteira</CardTitle>
            <p className="text-sm leading-6 text-slate-400">
              O saldo exibido já inclui aportes ainda não consolidados. Ao salvar, ele se torna o novo checkpoint.
            </p>
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
              label="Aporte mensal previsto"
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
            <LabeledDateInput
              label="Data de referência"
              value={form.referenceDate}
              open={isReferenceDatePickerOpen}
              onOpenChange={setIsReferenceDatePickerOpen}
              onChange={(referenceDate) =>
                setForm((state) => ({ ...state, referenceDate }))
              }
            />
            {projection?.unincorporatedContributionCents ? (
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100">
                <span className="text-cyan-300">Aportes ainda não consolidados: </span>
                {formatCurrency(projection.unincorporatedContributionCents)}
              </div>
            ) : null}
            <Button
              disabled={isPending}
              onClick={() => startTransition(() => void onSavePortfolio())}
            >
              {isPending ? "Salvando..." : "Salvar carteira"}
            </Button>
          </CardContent>
        </Card>

        <InvestmentContributionChart
          history={contributionHistory}
          canRegisterContribution={canRegisterContribution}
          onRegisterContribution={() => setIsContributionDialogOpen(true)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="h-full rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Projeções fixas</CardTitle>
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
                Salve a carteira para visualizar as projeções de 1, 6, 12 e 24 meses.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="h-full rounded-[1.75rem] border-slate-800 bg-[#06152d] text-white">
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
                      ? `Até ${formatSimulationMonth(selectedSimulationDate)}, considerando ${simulatedMonths} meses-calendário.`
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
      </div>

      {projection && simulatedMonths && selectedSimulationDate ? (
        <InvestmentGrowthChart
          currentBalanceCents={projection.currentBalanceCents}
          monthlyContributionCents={projection.monthlyContributionCents}
          expectedMonthlyRateBps={projection.expectedMonthlyRateBps}
          referenceDate={projection.referenceDate}
          months={simulatedMonths}
          periodLabel={formatSimulationMonth(selectedSimulationDate)}
        />
      ) : null}

      <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
        <DialogContent className="border-slate-800 bg-slate-950 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Registrar aporte</DialogTitle>
            <DialogDescription className="leading-6 text-slate-400">
              O lançamento será registrado como realizado e somado automaticamente ao saldo da carteira.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <LabeledInput
              id="investment-contribution-amount"
              label="Valor do aporte"
              value={contributionForm.amount}
              placeholder="0,00"
              onChange={(event) =>
                setContributionForm((state) => ({ ...state, amount: event.target.value }))
              }
            />
            <LabeledInput
              id="investment-contribution-date"
              label="Data do aporte"
              type="date"
              value={contributionForm.transactionDate}
              onChange={(event) =>
                setContributionForm((state) => ({
                  ...state,
                  transactionDate: event.target.value,
                }))
              }
            />
            <div className="space-y-2">
              <Label className="text-slate-200">Conta de origem</Label>
              <Select
                value={contributionForm.accountId}
                onValueChange={(accountId) =>
                  setContributionForm((state) => ({ ...state, accountId }))
                }
              >
                <SelectTrigger className={SELECT_TRIGGER_CLASSNAME}>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASSNAME}>
                  {sourceAccounts.map((account) => (
                    <SelectItem
                      key={account.id}
                      value={account.id}
                      className={SELECT_ITEM_CLASSNAME}
                    >
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Categoria de investimento</Label>
              <Select
                value={contributionForm.categoryId}
                onValueChange={(categoryId) =>
                  setContributionForm((state) => ({ ...state, categoryId }))
                }
              >
                <SelectTrigger className={SELECT_TRIGGER_CLASSNAME}>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent className={SELECT_CONTENT_CLASSNAME}>
                  {investmentCategories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className={SELECT_ITEM_CLASSNAME}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsContributionDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={
                isPending ||
                !contributionForm.amount ||
                !contributionForm.transactionDate ||
                !contributionForm.accountId ||
                !contributionForm.categoryId
              }
              onClick={() => startTransition(() => void onCreateContribution())}
            >
              {isPending ? "Registrando..." : "Registrar aporte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function LabeledDateInput({
  label,
  value,
  open,
  onOpenChange,
  onChange,
}: {
  label: string;
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseReferenceDate(value);

  return (
    <div className="space-y-2">
      <Label className="text-slate-200">{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-between rounded-xl border-slate-700 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
          >
            <span>{formatReferenceDateLabel(value)}</span>
            <CalendarDays className="size-4 text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950/95 p-0 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]"
        >
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) {
                return;
              }

              onChange(buildReferenceDate(date));
              onOpenChange(false);
            }}
            className="bg-transparent p-3 text-slate-100"
            classNames={{
              month_caption: "flex h-8 w-full items-center justify-center px-8 text-slate-100",
              caption_label: "text-sm font-medium text-slate-100",
              dropdowns: "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-100",
              weekday: "flex-1 rounded-md text-[0.8rem] font-normal text-slate-400 select-none",
              button_previous:
                "size-8 rounded-md border border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800",
              button_next:
                "size-8 rounded-md border border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
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
