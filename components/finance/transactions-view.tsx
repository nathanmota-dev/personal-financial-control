"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createTransactionAction,
  createTransferAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/actions/finance";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  centsToMoneyInput,
  extractErrorMessage,
  formatCurrency,
  formatDateLabel,
  formatMonthLabel,
  getStatusTone,
  getTransactionTone,
  moneyInputToCents,
  transactionStatusLabels,
  transactionTypeLabels,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

type AccountOption = {
  id: string;
  name: string;
  type: string;
  currentBalanceCents: number;
};

type CategoryOption = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
};

type TransactionRow = {
  id: string;
  accountId: string;
  categoryId: string;
  type: "income" | "expense" | "investment_contribution";
  status: "pending" | "posted" | "cancelled";
  amountCents: number;
  transactionDate: string;
  competenceMonth: string;
  description: string;
  notes?: string | null;
  account: { id: string; name: string } | null;
  category: { id: string; name: string; group: string } | null;
};

type TransferRow = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  transferDate: string;
  competenceMonth: string;
  description: string;
  fromAccount: { id: string; name: string } | null;
  toAccount: { id: string; name: string } | null;
};

type Filters = {
  month: string;
  accountId?: string;
  categoryId?: string;
  status?: string;
  type?: string;
  section?: string;
};

const EMPTY_FILTER_VALUE = "__empty-filter__";
const FILTER_SELECT_TRIGGER_CLASSNAME =
  "h-10 w-full rounded-xl border-slate-700 bg-slate-950/80 pr-11 pl-4 text-left text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)] hover:bg-slate-900/90 focus-visible:border-sky-400/70 focus-visible:ring-sky-400/20 data-[state=open]:border-slate-600 data-[state=open]:bg-slate-900";
const FILTER_SELECT_CONTENT_CLASSNAME =
  "rounded-[1.25rem] border-slate-800 bg-slate-950/96 p-1 text-slate-100 shadow-[0_24px_80px_rgba(2,6,23,0.45)]";
const FILTER_SELECT_ITEM_CLASSNAME =
  "min-h-10 rounded-[0.9rem] px-3 py-2 text-sm text-slate-200 focus:bg-slate-800 focus:text-slate-50 data-[state=checked]:bg-slate-800/90 data-[state=checked]:text-slate-50";

type FilterSelectOption = {
  value: string;
  label: string;
};

function FilterSelect({
  value,
  emptyLabel,
  options,
  onValueChange,
}: {
  value?: string;
  emptyLabel: string;
  options: FilterSelectOption[];
  onValueChange: (value?: string) => void;
}) {
  return (
    <Select
      value={value || EMPTY_FILTER_VALUE}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === EMPTY_FILTER_VALUE ? undefined : nextValue)
      }
    >
      <SelectTrigger className={FILTER_SELECT_TRIGGER_CLASSNAME}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        sideOffset={8}
        className={FILTER_SELECT_CONTENT_CLASSNAME}
      >
        <SelectItem value={EMPTY_FILTER_VALUE} className={FILTER_SELECT_ITEM_CLASSNAME}>
          {emptyLabel}
        </SelectItem>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={FILTER_SELECT_ITEM_CLASSNAME}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TransactionsView({
  accounts,
  categories,
  transactions,
  transfers,
  filters,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  transactions: TransactionRow[];
  transfers: TransferRow[];
  filters: Filters;
}) {
  const totals = useMemo(
    () =>
      transactions.reduce(
        (accumulator, item) => {
          if (item.type === "income" && item.status !== "cancelled") accumulator.income += item.amountCents;
          if (item.type === "expense" && item.status !== "cancelled") accumulator.expense += item.amountCents;
          if (item.type === "investment_contribution" && item.status !== "cancelled") {
            accumulator.investment += item.amountCents;
          }
          return accumulator;
        },
        { income: 0, expense: 0, investment: 0 }
      ),
    [transactions]
  );
  const hasSetup = accounts.length > 0 && categories.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lançamentos"
        title={`Movimentações de ${formatMonthLabel(filters.month)}`}
        description="A tela abre vazia por padrão quando ainda não existe base inicial. Você pode criar conta, categoria, lançamento e transferência daqui."
        actions={
          <>
            <AccountSetupDialog />
            <CategorySetupDialog />
            <TransactionDialog accounts={accounts} categories={categories} month={filters.month} />
            <TransferDialog accounts={accounts} month={filters.month} />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Receitas filtradas" value={formatCurrency(totals.income)} tone="cyan" />
        <SummaryCard label="Despesas filtradas" value={formatCurrency(totals.expense)} tone="blue" />
        <SummaryCard label="Aportes filtrados" value={formatCurrency(totals.investment)} tone="sky" />
      </section>

      <FilterCard accounts={accounts} categories={categories} filters={filters} />

      <Tabs defaultValue={filters.section === "transfers" ? "transfers" : "transactions"}>
        <TabsList variant="line">
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="transfers">Transferências</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Lista principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transactions.length ? (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Conta</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{formatDateLabel(transaction.transactionDate)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-100">{transaction.description}</p>
                                {transaction.notes ? (
                                  <p className="text-xs text-slate-400">{transaction.notes}</p>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>{transaction.account?.name ?? "-"}</TableCell>
                            <TableCell>{transaction.category?.name ?? "-"}</TableCell>
                            <TableCell>
                              <Badge className={cn("ring-1", getTransactionTone(transaction.type))}>
                                {transactionTypeLabels[transaction.type]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("ring-1", getStatusTone(transaction.status))}>
                                {transactionStatusLabels[transaction.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(transaction.amountCents)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <TransactionDialog
                                  accounts={accounts}
                                  categories={categories}
                                  month={filters.month}
                                  transaction={transaction}
                                  trigger={
                                    <Button variant="outline" size="icon-sm">
                                      <Pencil className="size-4" />
                                    </Button>
                                  }
                                />
                                <DeleteTransactionDialog id={transaction.id} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3 md:hidden">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="rounded-2xl border border-slate-800 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-100">{transaction.description}</p>
                            <p className="text-sm text-slate-400">
                              {formatDateLabel(transaction.transactionDate)} •{" "}
                              {transaction.account?.name ?? "-"}
                            </p>
                          </div>
                          <p className="font-semibold text-slate-100">
                            {formatCurrency(transaction.amountCents)}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className={cn("ring-1", getTransactionTone(transaction.type))}>
                            {transactionTypeLabels[transaction.type]}
                          </Badge>
                          <Badge className={cn("ring-1", getStatusTone(transaction.status))}>
                            {transactionStatusLabels[transaction.status]}
                          </Badge>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <TransactionDialog
                            accounts={accounts}
                            categories={categories}
                            month={filters.month}
                            transaction={transaction}
                            trigger={<Button variant="outline" className="flex-1">Editar</Button>}
                          />
                          <DeleteTransactionDialog id={transaction.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <FinanceEmptyState
                  title="Nenhum lançamento encontrado"
                  description="Se ainda não existe base inicial, cadastre conta e categoria primeiro. Depois, a criação do lançamento é liberada."
                  action={
                    hasSetup ? (
                      <TransactionDialog accounts={accounts} categories={categories} month={filters.month} />
                    ) : (
                      <SetupCallout
                        title="Base inicial obrigatoria"
                        description="Você precisa de ao menos uma conta e uma categoria antes do primeiro lançamento."
                      />
                    )
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
            <CardHeader>
              <CardTitle>Transferências do mês</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transfers.length ? (
                transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 p-4 md:flex-row md:items-center"
                  >
                    <div>
                      <p className="font-medium text-slate-100">{transfer.description}</p>
                      <p className="text-sm text-slate-400">
                        {formatDateLabel(transfer.transferDate)} •{" "}
                        {transfer.fromAccount?.name ?? "-"} para{" "}
                        {transfer.toAccount?.name ?? "-"}
                      </p>
                    </div>
                    <p className="font-semibold text-cyan-300">
                      {formatCurrency(transfer.amountCents)}
                    </p>
                  </div>
                ))
              ) : (
                <FinanceEmptyState
                  title="Sem transferências"
                  description="Transferências exigem pelo menos duas contas cadastradas."
                  action={
                    accounts.length >= 2 ? (
                      <TransferDialog accounts={accounts} month={filters.month} />
                    ) : (
                      <SetupCallout
                        title="Cadastre duas contas"
                        description="Crie pelo menos duas contas para conseguir transferir entre origem e destino."
                      />
                    )
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "blue" | "sky";
}) {
  const tones = {
    cyan: "text-cyan-300 bg-cyan-500/10",
    blue: "text-blue-300 bg-blue-500/10",
    sky: "text-sky-300 bg-sky-500/10",
  } as const;

  return (
    <Card className="rounded-[1.5rem] border-slate-800 bg-slate-950/75">
      <CardContent className="space-y-2 pt-6">
        <p className="text-sm text-slate-400">{label}</p>
        <p className={cn("font-heading text-3xl font-semibold tracking-tight", tones[tone])}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function FilterCard({
  accounts,
  categories,
  filters,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  filters: Filters;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function updateFilters(next: Partial<Filters>) {
    const merged = {
      month: filters.month,
      accountId: filters.accountId ?? "",
      categoryId: filters.categoryId ?? "",
      status: filters.status ?? "",
      type: filters.type ?? "",
      section: filters.section ?? "transactions",
      ...next,
    };
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(merged)) {
      const normalizedValue = String(value ?? "");

      if (normalizedValue) {
        params.set(key, normalizedValue);
      }
    }

    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          <MonthPickerField
            month={filters.month}
            onMonthChange={(month) => updateFilters({ month })}
            className="w-full"
          />
          <FilterSelect
            value={filters.type}
            emptyLabel="Todos os tipos"
            options={[
              { value: "income", label: "Receita" },
              { value: "expense", label: "Despesa" },
              { value: "investment_contribution", label: "Aporte" },
            ]}
            onValueChange={(type) => updateFilters({ type })}
          />
          <FilterSelect
            value={filters.accountId}
            emptyLabel="Todas as contas"
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
            onValueChange={(accountId) => updateFilters({ accountId })}
          />
          <FilterSelect
            value={filters.categoryId}
            emptyLabel="Todas as categorias"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            onValueChange={(categoryId) => updateFilters({ categoryId })}
          />
          <FilterSelect
            value={filters.status}
            emptyLabel="Todos os status"
            options={[
              { value: "pending", label: "Pendente" },
              { value: "posted", label: "Lançado" },
              { value: "cancelled", label: "Cancelado" },
            ]}
            onValueChange={(status) => updateFilters({ status })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionDialog({
  accounts,
  categories,
  month,
  transaction,
  trigger,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  month: string;
  transaction?: TransactionRow;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TransactionRow["type"]>(transaction?.type ?? "expense");
  const hasSetup = accounts.length > 0 && categories.length > 0;

  const filteredCategories = categories.filter((category) => {
    if (selectedType === "income") return category.group === "income";
    if (selectedType === "investment_contribution") return category.group === "investment";
    return category.group === "fixed_expense" || category.group === "variable_expense";
  });

  async function onSubmit(formData: FormData) {
    const payload = {
      accountId: String(formData.get("accountId")),
      categoryId: String(formData.get("categoryId")),
      type: String(formData.get("type")) as TransactionRow["type"],
      status: String(formData.get("status")) as TransactionRow["status"],
      amountCents: moneyInputToCents(String(formData.get("amount"))),
      transactionDate: String(formData.get("transactionDate")),
      competenceMonth: String(formData.get("competenceMonth")),
      description: String(formData.get("description")),
      notes: String(formData.get("notes") ?? ""),
    };

    try {
      if (transaction) {
        await updateTransactionAction({ id: transaction.id, ...payload });
        toast.success("Lançamento atualizado.");
      } else {
        await createTransactionAction(payload);
        toast.success("Lançamento criado.");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{transaction ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>Se não houver base inicial, crie conta e categoria primeiro.</DialogDescription>
        </DialogHeader>
        {hasSetup ? (
          <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as TransactionRow["type"])}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
                <option value="investment_contribution">Aporte</option>
              </select>
              <select
                name="status"
                defaultValue={transaction?.status ?? "posted"}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                <option value="pending">Pendente</option>
                <option value="posted">Lançado</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <select
                name="accountId"
                defaultValue={transaction?.accountId ?? accounts[0]?.id}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <select
                key={`${transaction?.id ?? "new"}-${selectedType}`}
                name="categoryId"
                defaultValue={transaction?.categoryId ?? filteredCategories[0]?.id}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input name="transactionDate" type="date" defaultValue={transaction?.transactionDate ?? `${month}-01`} />
              <Input name="competenceMonth" type="month" defaultValue={transaction?.competenceMonth ?? month} />
              <Input
                name="amount"
                placeholder="0,00"
                defaultValue={transaction ? centsToMoneyInput(transaction.amountCents) : ""}
              />
              <Input name="description" defaultValue={transaction?.description ?? ""} placeholder="Descrição" />
            </div>
            <Textarea name="notes" defaultValue={transaction?.notes ?? ""} placeholder="Observações" />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : transaction ? "Salvar alterações" : "Criar lançamento"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <SetupCallout
            title="Sem base inicial para lançamentos"
            description="Crie pelo menos uma conta e uma categoria antes do primeiro registro."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({
  accounts,
  month,
}: {
  accounts: AccountOption[];
  month: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const canTransfer = accounts.length >= 2;

  async function onSubmit(formData: FormData) {
    try {
      await createTransferAction({
        fromAccountId: String(formData.get("fromAccountId")),
        toAccountId: String(formData.get("toAccountId")),
        amountCents: moneyInputToCents(String(formData.get("amount"))),
        transferDate: String(formData.get("transferDate")),
        competenceMonth: String(formData.get("competenceMonth")),
        description: String(formData.get("description")),
      });
      toast.success("Transferência criada.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Nova transferência</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferência entre contas</DialogTitle>
          <DialogDescription>Você precisa de pelo menos duas contas para esta operação.</DialogDescription>
        </DialogHeader>
        {canTransfer ? (
          <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-4">
            <select
              name="fromAccountId"
              defaultValue={accounts[0]?.id}
              className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  Saída: {account.name}
                </option>
              ))}
            </select>
            <select
              name="toAccountId"
              defaultValue={accounts[1]?.id ?? accounts[0]?.id}
              className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  Entrada: {account.name}
                </option>
              ))}
            </select>
            <Input name="amount" placeholder="0,00" />
            <Input name="transferDate" type="date" defaultValue={`${month}-01`} />
            <Input name="competenceMonth" type="month" defaultValue={month} />
            <Input name="description" placeholder="Descrição da transferência" />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Criar transferência"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <SetupCallout
            title="Transferência indisponível"
            description="Cadastre pelo menos duas contas para movimentar saldo entre origem e destino."
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteTransactionDialog({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function onDelete() {
    try {
      await deleteTransactionAction(id);
      toast.success("Lançamento removido.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon-sm">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir lançamento</DialogTitle>
          <DialogDescription>Esta ação remove o registro em definitivo.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={() => startTransition(() => void onDelete())}>
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
