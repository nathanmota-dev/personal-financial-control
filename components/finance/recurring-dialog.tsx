"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createRecurringTemplateAction,
  updateRecurringTemplateAction,
} from "@/app/actions/finance";
import {
  isRecurringCategoryCompatible,
  recurringDefaultCategoryNames,
} from "@/lib/category-defaults";
import { SetupCallout } from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MoneyInput } from "@/components/finance/money-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  RecurringDialogProps,
  RecurringTemplateRow,
} from "@/lib/interfaces/recurring";
import {
  centsToMoneyInput,
  formatMoneyInput,
  moneyInputToCents,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const recurringFieldClassName = "";
const recurringSelectTriggerClassName = "w-full";
const recurringSelectContentClassName = "";
const recurringSelectItemClassName = "";
const recurringFieldLabelClassName = "text-xs font-medium text-content";

function compatibleCategories(
  categories: RecurringDialogProps["categories"],
  type: RecurringTemplateRow["type"],
) {
  return categories.filter((category) =>
    isRecurringCategoryCompatible(category.group, type),
  );
}

function defaultCategoryId(
  categories: RecurringDialogProps["categories"],
  type: RecurringTemplateRow["type"],
  currentCategoryId?: string | null,
) {
  const available = compatibleCategories(categories, type);
  const current = available.find(
    (category) => category.id === currentCategoryId,
  );

  return (
    current?.id ??
    available.find(
      (category) => category.name === recurringDefaultCategoryNames[type],
    )?.id ??
    available[0]?.id ??
    ""
  );
}

function defaultAccountId(
  accounts: RecurringDialogProps["accounts"],
  type: RecurringTemplateRow["type"],
  currentAccountId?: string,
) {
  const available =
    type === "investment_contribution"
      ? accounts.filter(
          (account) =>
            account.type === "checking" ||
            account.type === "savings" ||
            account.type === "cash",
        )
      : accounts;

  return (
    available.find((account) => account.id === currentAccountId)?.id ??
    available[0]?.id ??
    ""
  );
}

export function RecurringDialog({
  accounts,
  categories,
  month,
  template,
  trigger,
}: RecurringDialogProps) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState(template?.startMonth ?? month);
  const [endMonth, setEndMonth] = useState<string | undefined>(
    template?.endMonth ?? undefined,
  );
  const [selectedType, setSelectedType] = useState<
    RecurringTemplateRow["type"]
  >(template?.type ?? "expense");
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    defaultAccountId(
      accounts,
      template?.type ?? "expense",
      template?.accountId,
    ),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    defaultCategoryId(
      categories,
      template?.type ?? "expense",
      template?.categoryId,
    ),
  );
  const hasSetup = accounts.length > 0 && categories.length > 0;

  function resetFormState() {
    const type = template?.type ?? "expense";
    setSelectedType(type);
    setSelectedAccountId(defaultAccountId(accounts, type, template?.accountId));
    setSelectedCategoryId(
      defaultCategoryId(categories, type, template?.categoryId),
    );
    setStartMonth(template?.startMonth ?? month);
    setEndMonth(template?.endMonth ?? undefined);
    setFormError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetFormState();
    }
  }

  function handleTypeChange(value: string) {
    const nextType = value as RecurringTemplateRow["type"];
    setSelectedType(nextType);
    setSelectedAccountId(
      defaultAccountId(accounts, nextType, selectedAccountId),
    );
    setSelectedCategoryId(
      defaultCategoryId(categories, nextType, selectedCategoryId),
    );
  }

  async function onSubmit(formData: FormData) {
    setFormError(null);
    const name = String(formData.get("name") ?? "").trim();
    const rawAmount = String(formData.get("amount") ?? "").trim();
    const accountId = String(formData.get("accountId") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "").trim();

    if (!name) {
      setFormError("Informe um nome para a recorrência.");
      toast.error("Informe um nome para a recorrência.");
      return;
    }

    let amountCents: number;
    try {
      amountCents = moneyInputToCents(rawAmount);
    } catch {
      setFormError("Informe um valor monetário válido.");
      toast.error("Informe um valor monetário válido.");
      return;
    }

    if (amountCents <= 0) {
      setFormError("Informe um valor maior que zero.");
      toast.error("Informe um valor maior que zero.");
      return;
    }

    if (!accountId) {
      setFormError("Selecione uma conta para a recorrência.");
      toast.error("Selecione uma conta para a recorrência.");
      return;
    }

    if (!categoryId) {
      setFormError("Selecione uma categoria para a recorrência.");
      toast.error("Selecione uma categoria para a recorrência.");
      return;
    }

    const payload = {
      accountId,
      categoryId,
      type: String(formData.get("type")) as RecurringTemplateRow["type"],
      status: String(formData.get("status")) as RecurringTemplateRow["status"],
      amountCents,
      dayOfMonth: Number(formData.get("dayOfMonth")),
      startMonth: String(formData.get("startMonth") ?? ""),
      endMonth: String(formData.get("endMonth") ?? "") || undefined,
      name,
    };

    const result = template
      ? await updateRecurringTemplateAction({ id: template.id, ...payload })
      : await createRecurringTemplateAction(payload);

    if (!result.ok) {
      setFormError(result.error.message);
      toast.error(result.error.message);
      return;
    }

    toast.success(template ? "Recorrência atualizada." : "Recorrência criada.");
    setOpen(false);
    router.refresh();
  }

  const filteredCategories = compatibleCategories(categories, selectedType);
  const filteredAccounts =
    selectedType === "investment_contribution"
      ? accounts.filter(
          (account) =>
            account.type === "checking" ||
            account.type === "savings" ||
            account.type === "cash",
        )
      : accounts;

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
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {template ? "Editar recorrência" : "Nova recorrência"}
          </DialogTitle>
          <DialogDescription>
            Defina o compromisso que deve reaparecer todo mês. A categoria fica
            registrada em cada lançamento gerado.
          </DialogDescription>
        </DialogHeader>
        {hasSetup ? (
          <form
            key={`${template?.id ?? "new"}-${open}`}
            action={(formData) =>
              startTransition(() => void onSubmit(formData))
            }
            className="grid gap-5"
          >
            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-name`}
                className={recurringFieldLabelClassName}
              >
                Nome da recorrência
              </Label>
              <Input
                id={`${formId}-name`}
                name="name"
                autoFocus
                required
                defaultValue={template?.description ?? ""}
                placeholder="Ex.: aluguel, academia ou salário"
                className={cn(recurringFieldClassName, "")}
              />
              <p className="mt-2 text-xs leading-5 text-content">
                Este nome identifica a regra e os lançamentos gerados por ela.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-type`}
                  className={recurringFieldLabelClassName}
                >
                  Tipo de recorrência
                </Label>
                <Select
                  name="type"
                  value={selectedType}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger
                    id={`${formId}-type`}
                    className={recurringSelectTriggerClassName}
                  >
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className={recurringSelectContentClassName}>
                    <SelectItem
                      value="income"
                      className={recurringSelectItemClassName}
                    >
                      Receita
                    </SelectItem>
                    <SelectItem
                      value="expense"
                      className={recurringSelectItemClassName}
                    >
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
                <Label
                  htmlFor={`${formId}-status`}
                  className={recurringFieldLabelClassName}
                >
                  Status da recorrência
                </Label>
                {template?.status === "ended" ? (
                  <>
                    <input type="hidden" name="status" value="ended" />
                    <div
                      className={cn(
                        recurringFieldClassName,
                        "flex items-center px-4 text-content",
                      )}
                    >
                      Encerrada (registro antigo)
                    </div>
                  </>
                ) : (
                  <Select
                    name="status"
                    defaultValue={template?.status ?? "active"}
                  >
                    <SelectTrigger
                      id={`${formId}-status`}
                      className={recurringSelectTriggerClassName}
                    >
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className={recurringSelectContentClassName}>
                      <SelectItem
                        value="active"
                        className={recurringSelectItemClassName}
                      >
                        Ativa
                      </SelectItem>
                      <SelectItem
                        value="paused"
                        className={recurringSelectItemClassName}
                      >
                        Pausada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-account`}
                  className={recurringFieldLabelClassName}
                >
                  Conta de origem
                </Label>
                <Select
                  name="accountId"
                  value={selectedAccountId || undefined}
                  onValueChange={setSelectedAccountId}
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
                <Label
                  htmlFor={`${formId}-category`}
                  className={recurringFieldLabelClassName}
                >
                  Categoria
                </Label>
                <Select
                  name="categoryId"
                  value={selectedCategoryId || undefined}
                  onValueChange={setSelectedCategoryId}
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
                <p className="text-xs text-content">
                  {selectedType === "income"
                    ? "Receitas começam em Salário."
                    : selectedType === "investment_contribution"
                      ? "Aportes começam em Investimentos."
                      : "Despesas começam em Outros."}
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-amount`}
                  className={recurringFieldLabelClassName}
                >
                  Valor da recorrência
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-content">
                    R$
                  </span>
                  <MoneyInput
                    id={`${formId}-amount`}
                    name="amount"
                    inputMode="decimal"
                    required
                    defaultValue={
                      template
                        ? formatMoneyInput(
                            centsToMoneyInput(template.amountCents),
                          )
                        : ""
                    }

                    placeholder="120,00"
                    className={cn(
                      recurringFieldClassName,
                      "pl-12 text-right tabular-nums",
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-day`}
                  className={recurringFieldLabelClassName}
                >
                  Dia do lançamento
                </Label>
                <Input
                  id={`${formId}-day`}
                  name="dayOfMonth"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  required
                  defaultValue={template?.dayOfMonth ?? 5}
                  placeholder="Ex.: 5"
                  className={recurringFieldClassName}
                />
                <p className="text-xs text-content">
                  Em meses menores, usamos o último dia disponível.
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-start-month`}
                  className={recurringFieldLabelClassName}
                >
                  Mês de início
                </Label>
                <MonthPickerField
                  id={`${formId}-start-month`}
                  name="startMonth"
                  value={startMonth}
                  placeholder="Selecione o mês de início"
                  required
                  onMonthChange={(nextMonth) => {
                    if (nextMonth) setStartMonth(nextMonth);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${formId}-end-month`}
                  className={recurringFieldLabelClassName}
                >
                  Mês de encerramento{" "}
                  <span className="normal-case tracking-normal text-content-subtle">
                    (opcional)
                  </span>
                </Label>
                <MonthPickerField
                  id={`${formId}-end-month`}
                  name="endMonth"
                  value={endMonth}
                  placeholder="Sem fim"
                  clearable
                  onMonthChange={setEndMonth}
                />
              </div>
            </div>

            {formError ? (
              <p
                className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={isPending} className="min-w-40">
                {isPending
                  ? "Salvando..."
                  : template
                    ? "Salvar alterações"
                    : "Criar recorrência"}
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
