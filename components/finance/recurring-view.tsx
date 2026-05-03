"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Pencil, Play, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  createRecurringTemplateAction,
  endRecurringTemplateAction,
  generateRecurringTransactionsAction,
  pauseRecurringTemplateAction,
  updateRecurringTemplateAction,
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
import { Textarea } from "@/components/ui/textarea";
import {
  centsToMoneyInput,
  extractErrorMessage,
  formatCurrency,
  formatMonthLabel,
  getStatusTone,
  moneyInputToCents,
  recurringStatusLabels,
  transactionTypeLabels,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

type AccountOption = {
  id: string;
  name: string;
};

type CategoryOption = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
};

type TemplateRow = {
  id: string;
  accountId: string;
  categoryId: string;
  type: "income" | "expense" | "investment_contribution";
  status: "active" | "paused" | "ended";
  amountCents: number;
  dayOfMonth: number;
  startMonth: string;
  endMonth?: string | null;
  lastGeneratedMonth?: string | null;
  description: string;
  account: { id: string; name: string } | null;
  category: { id: string; name: string; group: string } | null;
};

export function RecurringView({
  accounts,
  categories,
  month,
  templates,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  month: string;
  templates: TemplateRow[];
}) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
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
            <Button
              variant="outline"
              disabled={isGenerating}
              onClick={() =>
                startGenerating(async () => {
                  try {
                    await generateRecurringTransactionsAction(month);
                    toast.success("Lançamentos recorrentes gerados.");
                    router.refresh();
                  } catch (error) {
                    toast.error(extractErrorMessage(error));
                  }
                })
              }
            >
              <Sparkles className="size-4" />
              {isGenerating ? "Gerando..." : "Gerar mês"}
            </Button>
          </>
        }
      />

      <Card className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
        <CardHeader>
          <CardTitle>Recorrências cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
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
    </div>
  );
}

function RecurringDialog({
  accounts,
  categories,
  month,
  template,
  trigger,
}: {
  accounts: AccountOption[];
  categories: CategoryOption[];
  month: string;
  template?: TemplateRow;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<TemplateRow["type"]>(template?.type ?? "expense");
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
      type: String(formData.get("type")) as TemplateRow["type"],
      status: String(formData.get("status")) as TemplateRow["status"],
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nova recorrência
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Editar recorrência" : "Nova recorrência"}</DialogTitle>
          <DialogDescription>Sem conta e categoria, a recorrência não pode ser criada.</DialogDescription>
        </DialogHeader>
        {hasSetup ? (
          <form action={(formData) => startTransition(() => void onSubmit(formData))} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                name="type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as TemplateRow["type"])}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
                <option value="investment_contribution">Aporte</option>
              </select>
              <select
                name="status"
                defaultValue={template?.status ?? "active"}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                <option value="active">Ativa</option>
                <option value="paused">Pausada</option>
                <option value="ended">Encerrada</option>
              </select>
              <select
                name="accountId"
                defaultValue={template?.accountId ?? accounts[0]?.id}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <select
                key={`${template?.id ?? "new"}-${selectedType}`}
                name="categoryId"
                defaultValue={template?.categoryId ?? filteredCategories[0]?.id}
                className="h-10 rounded-xl border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100"
              >
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Input name="amount" defaultValue={template ? centsToMoneyInput(template.amountCents) : ""} placeholder="0,00" />
              <Input name="dayOfMonth" type="number" min={1} max={28} defaultValue={template?.dayOfMonth ?? 5} />
              <Input name="startMonth" type="month" defaultValue={template?.startMonth ?? month} />
              <Input name="endMonth" type="month" defaultValue={template?.endMonth ?? ""} />
            </div>
            <Textarea name="description" defaultValue={template?.description ?? ""} placeholder="Descrição operacional" />
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

function PauseRecurringButton({ id }: { id: string }) {
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

function ResumeRecurringButton({ id }: { id: string }) {
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

function EndRecurringButton({ id, month }: { id: string; month: string }) {
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
