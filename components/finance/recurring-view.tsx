"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Pencil, Play, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createRecurringTemplateAction,
  endRecurringTemplateAction,
  pauseRecurringTemplateAction,
  updateRecurringTemplateAction,
} from "@/app/actions/finance";
import { CategorySpendingCharts } from "@/components/finance/category-spending-charts";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import { RecurringCalendar } from "@/components/finance/recurring-calendar";
import { RecurringMonthPicker } from "@/components/finance/recurring-month-picker";
import { RecurringSegmentedControl } from "@/components/finance/recurring-segmented-control";
import {
  AccountSetupDialog,
  CategorySetupDialog,
  SetupCallout,
} from "@/components/finance/setup-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  EndRecurringButtonProps,
  RecurringActionButtonProps,
  RecurringDialogProps,
  RecurringTemplateRow,
  RecurringViewProps,
} from "@/lib/interfaces/recurring";
import {
  centsToMoneyInput,
  extractErrorMessage,
  formatCurrency,
  formatMoneyInput,
  formatMonthLabel,
  getStatusTone,
  moneyInputToCents,
  recurringStatusLabels,
  transactionTypeLabels,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const recurringFieldClassName =
  "h-10 rounded-xl border-slate-700 bg-slate-950/80 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] placeholder:text-slate-600 focus-visible:border-cyan-400/70 focus-visible:ring-cyan-400/20";
const recurringSelectTriggerClassName =
  "h-10 w-full rounded-xl border-slate-700 bg-slate-950/80 pr-11 pl-4 text-left text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] hover:bg-slate-900/90 focus-visible:border-cyan-400/70 focus-visible:ring-cyan-400/20 data-[state=open]:border-slate-600 data-[state=open]:bg-slate-900";
const recurringSelectContentClassName =
  "rounded-[1.25rem] border-slate-800 bg-slate-950/96 p-1 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]";
const recurringSelectItemClassName =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-slate-200 focus:bg-slate-800 focus:text-slate-50 data-[state=checked]:bg-slate-800/90 data-[state=checked]:text-slate-50";
const recurringFieldLabelClassName =
  "text-xs uppercase tracking-[0.16em] text-slate-400";

export function RecurringView({
  accounts,
  categories,
  categorySpending,
  month,
  templates,
}: RecurringViewProps) {
  const hasSetup = accounts.length > 0 && categories.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Recorrentes"
        title={`Agenda recorrente de ${formatMonthLabel(month)}`}
        description="A tela também abre vazia por padrão. Se ainda não houver base inicial, crie conta e categoria por aqui."
        actions={
          <>
            <AccountSetupDialog />
            <CategorySetupDialog />
            <RecurringDialog accounts={accounts} categories={categories} month={month} />
          </>
        }
      />

      <Tabs defaultValue="recurring" className="gap-4">
        <RecurringSegmentedControl />

        <TabsContent value="recurring" className="mt-0">
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Recorrências cadastradas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {templates.length ? (
                templates.map((template) => (
                  <div key={template.id} className="rounded-[1.5rem] border border-slate-800 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-xl font-semibold text-slate-100">
                            {template.description}
                          </h3>
                          <Badge className={cn("ring-1", getStatusTone(template.status))}>
                            {recurringStatusLabels[template.status]}
                          </Badge>
                          <Badge variant="outline">{transactionTypeLabels[template.type]}</Badge>
                        </div>
                        <div className="grid gap-2 text-sm text-slate-400 md:grid-cols-2">
                          <p>Conta: {template.account?.name ?? "-"}</p>
                          <p>Categoria: {template.category?.name ?? "-"}</p>
                          <p>Valor: {formatCurrency(template.amountCents)}</p>
                          <p>Dia de lançamento: {template.dayOfMonth}</p>
                          <p>Início: {template.startMonth}</p>
                          <p>Fim: {template.endMonth ?? "Sem fim"}</p>
                        </div>
                        <p className="text-sm leading-6 text-slate-400">
                          {template.lastGeneratedMonth === month
                            ? `Já gerou lançamento em ${month}.`
                            : "Ainda não há geração para a competência em foco."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <RecurringDialog
                          accounts={accounts}
                          categories={categories}
                          month={month}
                          template={template}
                          trigger={
                            <Button variant="outline">
                              <Pencil className="size-4" />
                              Editar
                            </Button>
                          }
                        />
                        {template.status === "active" ? (
                          <PauseRecurringButton id={template.id} />
                        ) : template.status === "paused" ? (
                          <ResumeRecurringButton id={template.id} />
                        ) : null}
                        <EndRecurringButton id={template.id} month={month} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <FinanceEmptyState
                  title="Sem recorrências"
                  description="Crie a base de conta e categoria e depois cadastre a primeira recorrência."
                  action={
                    hasSetup ? (
                      <RecurringDialog accounts={accounts} categories={categories} month={month} />
                    ) : (
                      <SetupCallout
                        title="Base inicial obrigatoria"
                        description="Você precisa de uma conta e uma categoria para criar entradas, despesas ou aportes recorrentes."
                      />
                    )
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="mt-0">
          <CategorySpendingCharts
            categorySpending={categorySpending}
            className="xl:grid-cols-2"
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <RecurringCalendar key={month} month={month} templates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecurringDialog({
  accounts,
  categories,
  month,
  template,
  trigger,
}: RecurringDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formId = useId();
  const [startMonth, setStartMonth] = useState(template?.startMonth ?? month);
  const [endMonth, setEndMonth] = useState<string | undefined>(template?.endMonth ?? undefined);
  const [selectedType, setSelectedType] = useState<RecurringTemplateRow["type"]>(
    template?.type ?? "expense"
  );
  const hasSetup = accounts.length > 0 && categories.length > 0;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setSelectedType(template?.type ?? "expense");
      setStartMonth(template?.startMonth ?? month);
      setEndMonth(template?.endMonth ?? undefined);
    }
  }

  const filteredCategories = categories.filter((category) => {
    if (selectedType === "income") return category.group === "income";
    if (selectedType === "investment_contribution") return category.group === "investment";
    return category.group === "fixed_expense" || category.group === "variable_expense";
  });
  const filteredAccounts = accounts.filter((account) => {
    if (selectedType === "investment_contribution") {
      return account.type === "checking" || account.type === "savings" || account.type === "cash";
    }

    return true;
  });

  async function onSubmit(formData: FormData) {
    const payload = {
      accountId: String(formData.get("accountId")),
      categoryId: String(formData.get("categoryId")),
      type: String(formData.get("type")) as RecurringTemplateRow["type"],
      status: String(formData.get("status")) as RecurringTemplateRow["status"],
      amountCents: moneyInputToCents(String(formData.get("amount"))),
      dayOfMonth: Number(formData.get("dayOfMonth")),
      startMonth: String(formData.get("startMonth")),
      endMonth: String(formData.get("endMonth") ?? "") || undefined,
      description: String(formData.get("description")),
    };

    try {
      if (template) {
        await updateRecurringTemplateAction({ id: template.id, ...payload });
        toast.success("Recorrencia atualizada.");
      } else {
        await createRecurringTemplateAction(payload);
        toast.success("Recorrencia criada.");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nova recorrência
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-slate-800 bg-slate-950/95 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Editar recorrência" : "Nova recorrência"}</DialogTitle>
          <DialogDescription>Sem conta e categoria, a recorrência não pode ser criada.</DialogDescription>
        </DialogHeader>
        {hasSetup ? (
          <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-type`} className={recurringFieldLabelClassName}>
                  Tipo de recorrência
                </Label>
                <Select
                  name="type"
                  value={selectedType}
                  onValueChange={(value) =>
                    setSelectedType(value as RecurringTemplateRow["type"])
                  }
                >
                  <SelectTrigger id={`${formId}-type`} className={recurringSelectTriggerClassName}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    <SelectItem value="income" className={recurringSelectItemClassName}>
                      Receita
                    </SelectItem>
                    <SelectItem value="expense" className={recurringSelectItemClassName}>
                      Despesa
                    </SelectItem>
                    <SelectItem
                      value="investment_contribution"
                      className={recurringSelectItemClassName}
                    >
                      Aporte
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-status`} className={recurringFieldLabelClassName}>
                  Status da recorrência
                </Label>
                <Select name="status" defaultValue={template?.status ?? "active"}>
                  <SelectTrigger
                    id={`${formId}-status`}
                    className={recurringSelectTriggerClassName}
                  >
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    <SelectItem value="active" className={recurringSelectItemClassName}>
                      Ativa
                    </SelectItem>
                    <SelectItem value="paused" className={recurringSelectItemClassName}>
                      Pausada
                    </SelectItem>
                    <SelectItem value="ended" className={recurringSelectItemClassName}>
                      Encerrada
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-account`} className={recurringFieldLabelClassName}>
                  Conta de origem
                </Label>
                <Select
                  key={`${template?.id ?? "new"}-account-${selectedType}`}
                  name="accountId"
                  defaultValue={template?.accountId ?? filteredAccounts[0]?.id}
                >
                  <SelectTrigger
                    id={`${formId}-account`}
                    className={recurringSelectTriggerClassName}
                  >
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    {filteredAccounts.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id}
                        className={recurringSelectItemClassName}
                      >
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-category`} className={recurringFieldLabelClassName}>
                  Categoria
                </Label>
                <Select
                  key={`${template?.id ?? "new"}-${selectedType}`}
                  name="categoryId"
                  defaultValue={template?.categoryId ?? filteredCategories[0]?.id}
                >
                  <SelectTrigger
                    id={`${formId}-category`}
                    className={recurringSelectTriggerClassName}
                  >
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    {filteredCategories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className={recurringSelectItemClassName}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-amount`} className={recurringFieldLabelClassName}>
                  Valor da recorrência
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-slate-400">
                    R$
                  </span>
                  <Input
                    id={`${formId}-amount`}
                    name="amount"
                    type="text"
                    inputMode="decimal"
                    data-currency="BRL"
                    defaultValue={
                      template ? formatMoneyInput(centsToMoneyInput(template.amountCents)) : ""
                    }
                    onBlur={(event) => {
                      event.currentTarget.value = formatMoneyInput(event.currentTarget.value);
                    }}
                    placeholder="120,00"
                    className={cn(recurringFieldClassName, "pl-12 text-right font-mono")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-day`} className={recurringFieldLabelClassName}>
                  Dia do lançamento
                </Label>
                <Input
                  id={`${formId}-day`}
                  name="dayOfMonth"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  defaultValue={template?.dayOfMonth ?? 5}
                  placeholder="Ex.: 5"
                  className={recurringFieldClassName}
                />
                <p className="text-xs text-slate-500">
                  Use um dia entre 1 e 31. Em meses menores, usamos o último dia disponível.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-start-month`} className={recurringFieldLabelClassName}>
                  Mês de início
                </Label>
                <RecurringMonthPicker
                  id={`${formId}-start-month`}
                  name="startMonth"
                  month={startMonth}
                  placeholder="Selecione o mês de início"
                  onMonthChange={(nextMonth) => {
                    if (nextMonth) {
                      setStartMonth(nextMonth);
                    }
                  }}
                />
                <p className="text-xs text-slate-500">A partir de qual competência gerar.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-end-month`} className={recurringFieldLabelClassName}>
                  Mês de encerramento <span className="normal-case tracking-normal text-slate-600">(opcional)</span>
                </Label>
                <RecurringMonthPicker
                  id={`${formId}-end-month`}
                  name="endMonth"
                  month={endMonth}
                  placeholder="Sem fim"
                  clearable
                  onMonthChange={setEndMonth}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-description`} className={recurringFieldLabelClassName}>
                Nome da recorrência
              </Label>
              <Textarea
                id={`${formId}-description`}
                name="description"
                defaultValue={template?.description ?? ""}
                placeholder="Ex.: Academia, aluguel ou plano de celular"
                className="min-h-20 rounded-xl border-slate-700 bg-slate-950/80 text-sm text-slate-100 placeholder:text-slate-600 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] focus-visible:border-cyan-400/70 focus-visible:ring-cyan-400/20"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : template ? "Salvar alterações" : "Criar recorrência"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <SetupCallout
            title="Sem base inicial para recorrências"
            description="Crie conta e categoria antes de cadastrar uma recorrência."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PauseRecurringButton({ id }: RecurringActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await pauseRecurringTemplateAction(id);
            toast.success("Recorrência pausada.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      <Pause className="size-4" />
      {isPending ? "Pausando..." : "Pausar"}
    </Button>
  );
}

function ResumeRecurringButton({ id }: RecurringActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await updateRecurringTemplateAction({ id, status: "active" });
            toast.success("Recorrência retomada.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      <Play className="size-4" />
      {isPending ? "Retomando..." : "Retomar"}
    </Button>
  );
}

function EndRecurringButton({ id, month }: EndRecurringButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await endRecurringTemplateAction(id, month);
            toast.success("Recorrência encerrada.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      {isPending ? "Encerrando..." : "Encerrar"}
    </Button>
  );
}
