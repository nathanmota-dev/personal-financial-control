"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createTransactionAction,
  getInvestmentReductionSourcesAction,
  updateTransactionAction,
} from "@/app/actions/finance";
import { isTransactionCategoryCompatible } from "@/lib/category-defaults";
import { InvestmentReductionDialog } from "@/components/finance/investment-reduction-dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { MonthPickerField } from "@/components/ui/month-picker-field";
import { Textarea } from "@/components/ui/textarea";
import type {
  TransactionAccountOption,
  TransactionCategoryOption,
  TransactionDialogProps,
  TransactionMutationPayload,
  TransactionRow,
} from "@/lib/interfaces/transactions";
import type { TransactionFundingSource } from "@/lib/interfaces/transaction-funding";
import type {
  InvestmentReductionSelection,
  InvestmentReductionSource,
} from "@/lib/interfaces/investment-reconciliation";
import {
  centsToMoneyInput,
  formatCurrency,
  formatMoneyInput,
  moneyInputToCents,
  transactionTypeLabels,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

const NO_CATEGORY_VALUE = "__no-category__";
const fieldClassName =
  "h-11 rounded-xl border-input bg-surface/80 text-sm text-content-strong shadow-[inset_0_1px_0_rgb(var(--content-rgb) / .08)] placeholder:text-content-subtle focus-visible:border-brand/70 focus-visible:ring-brand/20";
const selectClassName =
  "h-11 w-full rounded-xl border border-input bg-surface/80 px-3 text-sm text-content-strong shadow-[inset_0_1px_0_rgb(var(--content-rgb) / .08)] outline-none transition-colors focus:border-brand/70 focus:ring-2 focus:ring-brand/20";
const labelClassName = "text-xs uppercase tracking-[0.16em] text-content";

function compatibleCategories(
  categories: TransactionCategoryOption[],
  type: TransactionRow["type"]
) {
  return categories.filter((category) => isTransactionCategoryCompatible(category.group, type));
}

function categoryValue(
  categories: TransactionCategoryOption[],
  type: TransactionRow["type"],
  currentCategoryId?: string | null
) {
  const category = categories.find(
    (option) => option.id === currentCategoryId && isTransactionCategoryCompatible(option.group, type)
  );

  if (category) {
    return category.id;
  }

  return type === "income" || type === "expense"
    ? NO_CATEGORY_VALUE
    : compatibleCategories(categories, type)[0]?.id ?? NO_CATEGORY_VALUE;
}

function accountValue(
  accounts: TransactionAccountOption[],
  type: TransactionRow["type"],
  currentAccountId?: string
) {
  const available = type === "expense" || investmentType(type)
    ? accounts.filter((account) =>
        account.type === "checking" || account.type === "savings" || account.type === "cash"
      )
    : accounts;

  return available.find((account) => account.id === currentAccountId)?.id ?? available[0]?.id ?? "";
}

function investmentType(type: TransactionRow["type"]) {
  return type === "investment_contribution" || type === "investment_withdrawal";
}

export function TransactionDialog({
  accounts,
  categories,
  month,
  transaction,
  trigger,
}: TransactionDialogProps) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const initialType = transaction?.type ?? "expense";
  const [selectedType, setSelectedType] = useState<TransactionRow["type"]>(initialType);
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    accountValue(accounts, initialType, transaction?.accountId)
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    categoryValue(categories, initialType, transaction?.categoryId)
  );
  const [transactionDate, setTransactionDate] = useState(
    transaction?.transactionDate ?? `${month}-01`
  );
  const [competenceMonth, setCompetenceMonth] = useState(
    transaction?.competenceMonth ?? month
  );
  const [fundingSource, setFundingSource] = useState<TransactionFundingSource>(
    transaction?.fundingSource ?? "account"
  );
  const [isReductionOpen, setIsReductionOpen] = useState(false);
  const [reductionSources, setReductionSources] = useState<InvestmentReductionSource[]>([]);
  const [reductionAmountCents, setReductionAmountCents] = useState(0);
  const [previousSelections, setPreviousSelections] = useState<InvestmentReductionSelection[]>([]);
  const [pendingPayload, setPendingPayload] = useState<TransactionMutationPayload | null>(null);

  function resetFormState() {
    const type = transaction?.type ?? "expense";
    setSelectedType(type);
    setSelectedAccountId(accountValue(accounts, type, transaction?.accountId));
    setSelectedCategoryId(categoryValue(categories, type, transaction?.categoryId));
    setTransactionDate(transaction?.transactionDate ?? `${month}-01`);
    setCompetenceMonth(transaction?.competenceMonth ?? month);
    setFundingSource(transaction?.fundingSource ?? "account");
    setFormError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetFormState();
    }
  }

  function handleTypeChange(value: string) {
    const nextType = value as TransactionRow["type"];
    setSelectedType(nextType);
    setFundingSource(nextType === "expense" ? fundingSource : "account");
    setSelectedAccountId(accountValue(accounts, nextType, selectedAccountId));
    const currentCategoryId = selectedCategoryId === NO_CATEGORY_VALUE ? null : selectedCategoryId;
    setSelectedCategoryId(categoryValue(categories, nextType, currentCategoryId));
  }

  async function onSubmit(formData: FormData) {
    setFormError(null);
    const accountId = String(formData.get("accountId") ?? "").trim();
    const categoryValueFromForm = String(formData.get("categoryId") ?? "").trim();
    const categoryId = categoryValueFromForm && categoryValueFromForm !== NO_CATEGORY_VALUE
      ? categoryValueFromForm
      : null;
    const description = String(formData.get("description") ?? "").trim();
    const rawAmount = String(formData.get("amount") ?? "").trim();
    const type = String(formData.get("type")) as TransactionMutationPayload["type"];
    const status = String(formData.get("status")) as TransactionMutationPayload["status"];
    const requestedFundingSource = String(formData.get("fundingSource") ?? "account") as TransactionFundingSource;
    const transactionDate = String(formData.get("transactionDate") ?? "");
    const competenceMonth = String(formData.get("competenceMonth") ?? "");

    if (!accountId) {
      showError("Selecione uma conta para o lançamento.");
      return;
    }

    if (!description) {
      showError("Informe uma descrição para o lançamento.");
      return;
    }

    let amountCents: number;
    try {
      amountCents = moneyInputToCents(rawAmount);
    } catch {
      showError("Informe um valor monetário válido.");
      return;
    }

    if (amountCents <= 0) {
      showError("Informe um valor maior que zero.");
      return;
    }

    if (!transactionDate || !competenceMonth) {
      showError("Informe a data e a competência do lançamento.");
      return;
    }

    if (investmentType(type) && !categoryId) {
      showError("Aportes e resgates exigem uma categoria.");
      return;
    }

    const payload: TransactionMutationPayload = {
      accountId,
      categoryId,
      type,
      status,
      amountCents,
      transactionDate,
      competenceMonth,
      description,
      notes: String(formData.get("notes") ?? ""),
      fundingSource: type === "expense" && !transaction?.recurringTemplateId
        ? requestedFundingSource
        : "account",
    };

    try {
      if (needsInvestmentReductionConfirmation(payload)) {
        const sourceResult = await getInvestmentReductionSourcesAction({
          transactionId: transaction?.fundingLink?.withdrawalTransactionId ?? transaction?.id,
        });

        if (
          (sourceResult.sources.length > 0 || sourceResult.previousSelections.length > 0) &&
          (!sourceResult.checkpointDate || payload.transactionDate > sourceResult.checkpointDate)
        ) {
          setReductionSources(sourceResult.sources);
          setReductionAmountCents(payload.amountCents);
          setPreviousSelections(sourceResult.previousSelections);
          setPendingPayload(payload);
          setIsReductionOpen(true);
          return;
        }
      }

      await persistTransaction(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar o lançamento.";
      showError(message);
    }
  }

  function showError(message: string) {
    setFormError(message);
    toast.error(message);
  }

  async function persistTransaction(
    payload: TransactionMutationPayload,
    sourceSelections?: InvestmentReductionSelection[]
  ) {
    const nextPayload = sourceSelections ? { ...payload, sourceSelections } : payload;
    const result = transaction
      ? await updateTransactionAction({ id: transaction.id, ...nextPayload })
      : await createTransactionAction(nextPayload);

    if (!result.ok) {
      showError(result.error.message);
      return;
    }

    toast.success(transaction ? "Lançamento atualizado." : "Lançamento criado.");
    clearReductionState();
    setOpen(false);
    router.refresh();
  }

  async function confirmReduction(selections: InvestmentReductionSelection[]) {
    if (!pendingPayload) {
      return;
    }

    try {
      await persistTransaction(pendingPayload, selections);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Não foi possível salvar o lançamento.");
    }
  }

  function clearReductionState() {
    setIsReductionOpen(false);
    setPendingPayload(null);
    setReductionSources([]);
    setPreviousSelections([]);
  }

  const filteredCategories = compatibleCategories(categories, selectedType);
  const filteredAccounts = selectedType === "expense" || investmentType(selectedType)
    ? accounts.filter((account) =>
        account.type === "checking" || account.type === "savings" || account.type === "cash"
      )
    : accounts;
  const categoryRequired = investmentType(selectedType);
  const isExpense = selectedType === "expense";
  const isManualExpense = isExpense && !transaction?.recurringTemplateId;
  const isInvestmentExpense = isManualExpense && fundingSource === "investments";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" />
              Novo lançamento
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-border bg-surface/95 sm:max-w-2xl">
          <DialogHeader className="border-b border-border pb-5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-brand">Registro manual</p>
            <DialogTitle className="text-2xl text-content-strong">
              {transaction ? "Editar lançamento" : "Novo lançamento"}
            </DialogTitle>
            <DialogDescription>
              Receitas e despesas podem ficar sem categoria agora e ser organizadas depois. Aportes e resgates continuam exigindo categoria.
            </DialogDescription>
          </DialogHeader>
          {accounts.length ? (
            <form
              key={`${transaction?.id ?? "new"}-${open}`}
              action={(formData) => startTransition(() => void onSubmit(formData))}
              className="grid gap-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-type`} className={labelClassName}>Tipo</Label>
                  <select id={`${formId}-type`} name="type" value={selectedType} onChange={(event) => handleTypeChange(event.target.value)} className={selectClassName}>
                    {Object.entries(transactionTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-status`} className={labelClassName}>Status</Label>
                  <select id={`${formId}-status`} name="status" defaultValue={transaction?.status ?? "posted"} className={selectClassName}>
                    <option value="pending">Pendente</option>
                    <option value="posted">Lançado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                {isManualExpense ? (
                  <fieldset className="space-y-2 md:col-span-2">
                    <legend className={labelClassName}>Origem da despesa</legend>
                    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Origem da despesa">
                      <label
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors",
                          fundingSource === "account"
                            ? "border-brand/35 bg-brand/[0.08]"
                            : "border-border bg-surface-raised/50 hover:border-input"
                        )}
                      >
                        <input
                          type="radio"
                          name="fundingSource"
                          value="account"
                          checked={fundingSource === "account"}
                          onChange={() => setFundingSource("account")}
                          className="mt-1 accent-brand"
                        />
                        <span>
                          <span className="block text-sm font-medium text-content-strong">Saldo em conta</span>
                          <span className="mt-1 block text-xs leading-5 text-content-strong0">A despesa reduz diretamente o saldo líquido da conta.</span>
                        </span>
                      </label>
                      <label
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-2xl border p-3 transition-colors",
                          fundingSource === "investments"
                            ? "border-warning/35 bg-warning/[0.08]"
                            : "border-border bg-surface-raised/50 hover:border-input"
                        )}
                      >
                        <input
                          type="radio"
                          name="fundingSource"
                          value="investments"
                          checked={fundingSource === "investments"}
                          onChange={() => setFundingSource("investments")}
                          className="mt-1 accent-warning"
                        />
                        <span>
                          <span className="block text-sm font-medium text-content-strong">Investimentos</span>
                          <span className="mt-1 block text-xs leading-5 text-content-strong0">Cria um resgate automático e registra de quais ativos ele saiu.</span>
                        </span>
                      </label>
                    </div>
                  </fieldset>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-account`} className={labelClassName}>
                    {isInvestmentExpense ? "Conta do resgate e da despesa" : "Conta"}
                  </Label>
                  <select id={`${formId}-account`} name="accountId" value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)} className={selectClassName} required>
                    {filteredAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} · saldo atual {formatCurrency(account.currentBalanceCents)}
                      </option>
                    ))}
                  </select>
                  {isInvestmentExpense ? (
                    <p className="text-xs text-content-strong0">O resgate entra nesta conta e a despesa sai dela, mantendo o efeito líquido zerado.</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-category`} className={labelClassName}>Categoria</Label>
                  <select id={`${formId}-category`} name="categoryId" value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} className={selectClassName} required={categoryRequired}>
                    {!categoryRequired ? <option value={NO_CATEGORY_VALUE}>Sem categoria</option> : null}
                    {!filteredCategories.length && categoryRequired ? <option value={NO_CATEGORY_VALUE}>Nenhuma categoria compatível</option> : null}
                    {filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <p className="text-xs text-content-strong0">
                    {categoryRequired ? "Obrigatória para movimentações de investimento." : "Opcional; você pode categorizar depois."}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-amount`} className={labelClassName}>Valor</Label>
                  <Input id={`${formId}-amount`} name="amount" inputMode="decimal" defaultValue={transaction ? centsToMoneyInput(transaction.amountCents) : ""} onBlur={(event) => { event.currentTarget.value = formatMoneyInput(event.currentTarget.value); }} placeholder="0,00" className={cn(fieldClassName, "font-mono")} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-date`} className={labelClassName}>Data</Label>
                  <DatePickerField
                    id={`${formId}-date`}
                    name="transactionDate"
                    value={transactionDate}
                    required
                    onDateChange={(nextDate) => { if (nextDate) setTransactionDate(nextDate); }}
                    className={fieldClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-competence`} className={labelClassName}>Competência</Label>
                  <MonthPickerField
                    id={`${formId}-competence`}
                    name="competenceMonth"
                    value={competenceMonth}
                    required
                    onMonthChange={(nextMonth) => { if (nextMonth) setCompetenceMonth(nextMonth); }}
                    className={fieldClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${formId}-description`} className={labelClassName}>Descrição</Label>
                  <Input id={`${formId}-description`} name="description" defaultValue={transaction?.description ?? ""} placeholder="Ex.: mercado, salário ou assinatura" className={fieldClassName} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${formId}-notes`} className={labelClassName}>Observações <span className="normal-case tracking-normal text-content-subtle">(opcional)</span></Label>
                <Textarea id={`${formId}-notes`} name="notes" defaultValue={transaction?.notes ?? ""} placeholder="Contexto adicional para este lançamento" className="min-h-20 rounded-xl border-input bg-surface/80 text-sm text-content-strong placeholder:text-content-subtle focus-visible:border-brand/70 focus-visible:ring-brand/20" />
              </div>
              {formError ? <p className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{formError}</p> : null}
              <DialogFooter>
                <Button type="submit" disabled={isPending} className="min-w-40">{isPending ? "Salvando..." : transaction ? "Salvar alterações" : "Criar lançamento"}</Button>
              </DialogFooter>
            </form>
          ) : (
            <SetupCallout title="Sem contas cadastradas" description="Crie pelo menos uma conta antes de registrar uma movimentação." />
          )}
        </DialogContent>
      </Dialog>
      <InvestmentReductionDialog
        key={`transaction-reduction-${isReductionOpen}-${transaction?.id ?? "new"}-${reductionAmountCents}-${previousSelections.map((selection) => `${selection.sourceId}:${selection.amountCents}`).join("|")}`}
        open={isReductionOpen}
        title={transaction ? "Redistribuir a origem do resgate" : "De onde saiu o resgate?"}
        description="Selecione os ativos, saldos livres ou patrimônio não cadastrado que deram origem a este resgate."
        amountCents={reductionAmountCents}
        sources={reductionSources}
        initialSelections={previousSelections}
        isPending={isPending}
        onOpenChange={setIsReductionOpen}
        onCancel={clearReductionState}
        onConfirm={(selections) => startTransition(() => void confirmReduction(selections))}
        confirmLabel={transaction ? "Salvar resgate" : "Criar resgate"}
        footerNote="A seleção fica registrada para que uma futura edição ou exclusão restaure os valores corretos."
      />
    </>
  );
}

function needsInvestmentReductionConfirmation(payload: TransactionMutationPayload) {
  const isFundedExpense = payload.type === "expense" && payload.fundingSource === "investments";
  const isManualWithdrawal = payload.type === "investment_withdrawal";

  return (isFundedExpense || isManualWithdrawal) && payload.status === "posted" && payload.transactionDate <= todayDate();
}

function todayDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
