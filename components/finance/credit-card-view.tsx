"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createCreditCardChargeAction } from "@/app/actions/finance";
import { CreditBudgetSummary } from "@/components/finance/credit-budget-summary";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
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
import { MonthPickerField } from "@/components/ui/month-picker-field";
import { Textarea } from "@/components/ui/textarea";
import {
  extractErrorMessage,
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  moneyInputToCents,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
};

type CreditCardOverview =
  | {
      state: "no_account";
      month: string;
    }
  | {
      state: "multiple_accounts";
      month: string;
      accounts: Array<{
        id: string;
        name: string;
        creditClosingDay: number | null;
        creditDueDay: number;
      }>;
    }
  | {
      state: "ready";
      month: string;
      needsConfiguration: boolean;
      account: {
        id: string;
        name: string;
        type: "checking" | "savings" | "cash" | "credit" | "investment";
        initialBalanceCents: number;
        creditClosingDay: number | null;
        creditDueDay: number;
      };
      budgetSummary: {
        incomeCents: number;
        nonCardExpenseCents: number;
        investmentContributionCents: number;
        investmentWithdrawalCents: number;
        availableForInvoiceCents: number;
        invoiceTotalCents: number;
        remainingAfterInvoiceCents: number;
      };
      invoice: {
        totalAmountCents: number;
        purchaseCount: number;
        entries: Array<{
          id: string;
          source: "installment" | "legacy_transaction";
          amountCents: number;
          description: string;
          expenseDate: string;
          purchaseDate: string;
          notes?: string | null;
          installmentNumber?: number;
          installmentCount?: number;
          category: {
            id: string;
            name: string;
            group: string;
          } | null;
        }>;
        categoryTotals: Array<{
          categoryId: string;
          categoryName: string;
          amountCents: number;
          group: string;
        }>;
        futureInstallments: Array<{
          id: string;
          description: string;
          purchaseDate: string;
          totalAmountCents: number;
          installmentCount: number;
          remainingAmountCents: number;
          category: {
            id: string;
            name: string;
            group: string;
          } | null;
          installments: Array<{
            id: string;
            installmentNumber: number;
            amountCents: number;
            invoiceMonth: string;
          }>;
        }>;
      };
    };

export function CreditCardView({
  overview,
  categories,
}: {
  overview: CreditCardOverview;
  categories: CategoryOption[];
}) {
  const expenseCategories = categories.filter(
    (category) =>
      category.group === "fixed_expense" || category.group === "variable_expense"
  );

  if (overview.state === "no_account") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cartão"
          title={`Cartão de crédito em ${formatMonthLabel(overview.month)}`}
          description="Crie uma conta do tipo cartão para acompanhar fatura, compras e parcelas futuras em um lugar separado."
          actions={<MonthOnlyAction month={overview.month} />}
        />
        <FinanceEmptyState
          title="Nenhum cartão configurado"
          description="Cadastre uma conta do tipo cartão para liberar a nova visão de fatura."
          action={<AccountSetupDialog />}
        />
      </div>
    );
  }

  if (overview.state === "multiple_accounts") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cartão"
          title={`Cartão de crédito em ${formatMonthLabel(overview.month)}`}
          description="A primeira versão desta tela trabalha com apenas um cartão ativo."
          actions={<MonthOnlyAction month={overview.month} />}
        />
        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Mais de um cartão ativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-400">
              Há mais de uma conta do tipo cartão cadastrada. Esta tela foi implementada para
              operar com um único cartão ativo.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {overview.accounts.map((account) => (
                <div key={account.id} className="rounded-2xl border border-slate-800 p-4">
                  <p className="font-medium text-slate-100">{account.name}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Fechamento: {account.creditClosingDay ? `dia ${account.creditClosingDay}` : "não configurado"}
                  </p>
                  <p className="text-sm text-slate-400">Vencimento: dia {account.creditDueDay}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canCreatePurchase = expenseCategories.length > 0 && !overview.needsConfiguration;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cartão"
        title={`Cartão ${overview.account.name} em ${formatMonthLabel(overview.month)}`}
        description="Fatura do mês, compras categorizadas e parcelas futuras concentradas em uma única tela."
        actions={
          <CreditCardActions
            month={overview.month}
            accountId={overview.account.id}
            categories={expenseCategories}
            canCreatePurchase={canCreatePurchase}
          />
        }
      />

      {overview.needsConfiguration ? (
        <InlineSetupCard
          title="Configure o fechamento do cartão"
          description="Defina o dia de fechamento para o app calcular automaticamente em qual fatura cada compra entra."
          action={
            <AccountSetupDialog
              account={overview.account}
              trigger={<Button>Editar cartão</Button>}
            />
          }
        />
      ) : null}

      {!expenseCategories.length ? (
        <InlineSetupCard
          title="Cadastre categorias de despesa"
          description="Compras no cartão usam categorias de gasto fixo ou variável para organizar a fatura."
          action={<CategorySetupDialog />}
        />
      ) : null}

      <CreditBudgetSummary
        incomeCents={overview.budgetSummary.incomeCents}
        nonCardExpenseCents={overview.budgetSummary.nonCardExpenseCents}
        investmentContributionCents={overview.budgetSummary.investmentContributionCents}
        investmentWithdrawalCents={overview.budgetSummary.investmentWithdrawalCents}
        availableForInvoiceCents={overview.budgetSummary.availableForInvoiceCents}
        invoiceTotalCents={overview.budgetSummary.invoiceTotalCents}
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Fatura do mês</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <InvoiceMetric
              label="Valor total"
              value={formatCurrency(overview.invoice.totalAmountCents)}
              accent="text-cyan-300"
            />
            <InvoiceMetric
              label="Compras lançadas"
              value={String(overview.invoice.purchaseCount)}
              accent="text-sky-300"
            />
            <InvoiceMetric
              label="Ciclo"
              value={
                overview.account.creditClosingDay
                  ? `Fecha dia ${overview.account.creditClosingDay}`
                  : "Sem fechamento"
              }
              accent="text-blue-300"
              secondary={`Vence dia ${overview.account.creditDueDay}`}
            />
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Leitura rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-slate-800 p-4">
              <p className="text-sm text-slate-400">Disponível menos a fatura</p>
              <p
                className={cn(
                  "mt-2 font-heading text-3xl font-semibold tracking-tight",
                  overview.budgetSummary.remainingAfterInvoiceCents >= 0
                    ? "text-cyan-300"
                    : "text-rose-300"
                )}
              >
                {formatCurrency(overview.budgetSummary.remainingAfterInvoiceCents)}
              </p>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              Esse valor compara o que sobra no mês depois dos gastos fora do cartão com a
              fatura atual.
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Compras na fatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.invoice.entries.length ? (
              overview.invoice.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 p-4 md:flex-row md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-100">{entry.description}</p>
                      {entry.installmentNumber && entry.installmentCount ? (
                        <Badge variant="outline">
                          {entry.installmentNumber}/{entry.installmentCount}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Legado</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {entry.category?.name ?? "Sem categoria"} • compra em{" "}
                      {formatDateLabel(entry.purchaseDate)}
                    </p>
                    {entry.notes ? (
                      <p className="mt-2 text-xs leading-5 text-slate-500">{entry.notes}</p>
                    ) : null}
                  </div>
                  <p className="font-semibold text-cyan-300">{formatCurrency(entry.amountCents)}</p>
                </div>
              ))
            ) : (
              <FinanceEmptyState
                title="Sem compras nesta fatura"
                description="Quando houver compras ou parcelas cobradas no mês selecionado, elas aparecerão aqui."
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.invoice.categoryTotals.length ? (
              overview.invoice.categoryTotals.map((category) => (
                <div
                  key={category.categoryId}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-slate-100">{category.categoryName}</p>
                    <p className="text-sm text-slate-400">
                      {category.group === "fixed_expense" ? "Gasto fixo" : "Gasto variável"}
                    </p>
                  </div>
                  <p className="font-semibold text-blue-300">
                    {formatCurrency(category.amountCents)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-400">
                Ainda não há categorias associadas à fatura selecionada.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
        <CardHeader>
          <CardTitle>Parcelas futuras</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overview.invoice.futureInstallments.length ? (
            overview.invoice.futureInstallments.map((charge) => (
              <div key={charge.id} className="rounded-2xl border border-slate-800 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="font-medium text-slate-100">{charge.description}</p>
                    <p className="text-sm text-slate-400">
                      {charge.category?.name ?? "Sem categoria"} • compra em{" "}
                      {formatDateLabel(charge.purchaseDate)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-cyan-300">
                      {formatCurrency(charge.remainingAmountCents)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Restante de {charge.installments.length} parcela(s)
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {charge.installments.map((installment) => (
                    <div key={installment.id} className="rounded-2xl bg-slate-900/80 p-3">
                      <p className="text-sm text-slate-400">
                        {installment.installmentNumber}/{charge.installmentCount} •{" "}
                        {formatMonthLabel(installment.invoiceMonth)}
                      </p>
                      <p className="mt-1 font-semibold text-slate-100">
                        {formatCurrency(installment.amountCents)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-slate-400">
              Nenhuma compra com parcelas futuras foi encontrada a partir do mês selecionado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreditCardActions({
  month,
  accountId,
  categories,
  canCreatePurchase,
}: {
  month: string;
  accountId: string;
  categories: CategoryOption[];
  canCreatePurchase: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function updateMonth(nextMonth: string) {
    const params = new URLSearchParams();
    params.set("month", nextMonth);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <MonthPickerField month={month} onMonthChange={updateMonth} className="w-full sm:w-[240px]" />
      <CreditCardPurchaseDialog
        accountId={accountId}
        categories={categories}
        month={month}
        disabled={!canCreatePurchase}
      />
    </div>
  );
}

function MonthOnlyAction({ month }: { month: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function updateMonth(nextMonth: string) {
    const params = new URLSearchParams();
    params.set("month", nextMonth);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return <MonthPickerField month={month} onMonthChange={updateMonth} className="w-full sm:w-[240px]" />;
}

function CreditCardPurchaseDialog({
  accountId,
  categories,
  month,
  disabled,
}: {
  accountId: string;
  categories: CategoryOption[];
  month: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    try {
      await createCreditCardChargeAction({
        accountId,
        categoryId: String(formData.get("categoryId")),
        description: String(formData.get("description")),
        notes: String(formData.get("notes") ?? ""),
        purchaseDate: String(formData.get("purchaseDate")),
        totalAmountCents: moneyInputToCents(String(formData.get("amount"))),
        installmentCount: Number(formData.get("installmentCount")),
      });

      toast.success("Compra do cartão criada.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="size-4" />
          Nova compra
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova compra no cartão</DialogTitle>
          <DialogDescription>
            O fechamento do cartão decide automaticamente em qual fatura a compra entra.
          </DialogDescription>
        </DialogHeader>
        {categories.length ? (
          <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="categoryId"
                defaultValue={categories[0]?.id}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input name="purchaseDate" type="date" defaultValue={`${month}-01`} />
              <Input name="amount" placeholder="0,00" />
              <Input
                name="installmentCount"
                type="number"
                min="1"
                max="60"
                defaultValue="1"
                placeholder="Quantidade de parcelas"
              />
              <Input
                name="description"
                className="md:col-span-2"
                placeholder="Descrição da compra"
              />
            </div>
            <Textarea name="notes" defaultValue="" placeholder="Observações" />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Criar compra"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <SetupCallout
            title="Sem categorias de despesa"
            description="Crie uma categoria de gasto fixo ou variável antes de lançar compras no cartão."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InvoiceMetric({
  label,
  value,
  accent,
  secondary,
}: {
  label: string;
  value: string;
  accent: string;
  secondary?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={cn("mt-2 font-heading text-3xl font-semibold tracking-tight", accent)}>{value}</p>
      {secondary ? <p className="mt-2 text-xs leading-5 text-slate-500">{secondary}</p> : null}
    </div>
  );
}

function InlineSetupCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <Card className="rounded-[1.75rem] border-sky-900/60 bg-sky-950/30">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-slate-100">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
