"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  archiveAccountAction,
  archiveCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/finance";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { PageHeader } from "@/components/finance/page-header";
import { AccountSetupDialog, CategorySetupDialog } from "@/components/finance/setup-dialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  accountTypeLabels,
  categoryGroupLabels,
  extractErrorMessage,
  formatCurrency,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

type AccountRow = {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit" | "investment";
  initialBalanceCents: number;
  currentBalanceCents: number;
  creditClosingDay: number | null;
  creditDueDay: number;
  isArchived: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  group: "income" | "fixed_expense" | "variable_expense" | "investment";
  isArchived: boolean;
};

export function SettingsView({
  accounts,
  categories,
}: {
  accounts: AccountRow[];
  categories: CategoryRow[];
}) {
  const categoriesByGroup = useMemo(
    () =>
      categories.reduce<Record<string, CategoryRow[]>>((accumulator, category) => {
        accumulator[category.group] ??= [];
        accumulator[category.group].push(category);
        return accumulator;
      }, {}),
    [categories]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configurações"
        title="Contas e categorias"
        description="Esta página também abre vazia por padrão e serve como ponto de partida para cadastrar toda a base do app."
      />

      <Tabs defaultValue="accounts">
        <TabsList variant="line">
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.length ? (
              accounts.map((account) => (
                <Card key={account.id} className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{account.name}</CardTitle>
                        <p className="mt-1 text-sm text-slate-400">{accountTypeLabels[account.type]}</p>
                      </div>
                      {account.isArchived ? <Badge variant="outline">Arquivada</Badge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {account.type === "credit" ? (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className={cn(financeItemClassName, "p-3")}>
                          <p className="text-slate-400">Fechamento</p>
                          <p className="mt-1 font-semibold text-slate-100">
                            {account.creditClosingDay ? `Dia ${account.creditClosingDay}` : "Não configurado"}
                          </p>
                        </div>
                        <div className={cn(financeItemClassName, "p-3")}>
                          <p className="text-slate-400">Vencimento</p>
                          <p className="mt-1 font-semibold text-cyan-300">
                            Dia {account.creditDueDay}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className={cn(financeItemClassName, "p-3")}>
                          <p className="text-slate-400">Saldo inicial</p>
                          <p className="mt-1 font-semibold text-slate-100">
                            {formatCurrency(account.initialBalanceCents)}
                          </p>
                        </div>
                        <div className={cn(financeItemClassName, "p-3")}>
                          <p className="text-slate-400">Saldo atual</p>
                          <p className="mt-1 font-semibold text-cyan-300">
                            {formatCurrency(account.currentBalanceCents)}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <AccountSetupDialog
                        account={account}
                        trigger={
                          <Button variant="outline" className="flex-1">
                            <Pencil className="size-4" />
                            Editar
                          </Button>
                        }
                      />
                      {!account.isArchived ? <ArchiveAccountButton id={account.id} /> : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <FinanceEmptyState
                title="Nenhuma conta cadastrada"
                description="Crie ao menos uma conta para destravar lançamentos, transferências e recorrências."
                action={<AccountSetupDialog />}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid gap-6">
            {Object.entries(categoriesByGroup).map(([group, rows]) => (
              <Card key={group} className="rounded-[1.75rem] border-slate-800 bg-slate-950/75">
                <CardHeader>
                  <CardTitle>{categoryGroupLabels[group as keyof typeof categoryGroupLabels]}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {rows.map((category) => (
                    <div key={category.id} className="rounded-2xl border border-slate-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-100">{category.name}</p>
                          <p className="text-sm text-slate-400">
                            {categoryGroupLabels[category.group]}
                          </p>
                        </div>
                        {category.isArchived ? <Badge variant="outline">Arquivada</Badge> : null}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <CategorySetupDialog
                          category={category}
                          trigger={
                            <Button variant="outline" className="flex-1">
                              <Pencil className="size-4" />
                              Editar
                            </Button>
                          }
                        />
                        {!category.isArchived ? <ArchiveCategoryButton id={category.id} /> : null}
                        <DeleteCategoryButton id={category.id} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            {!Object.keys(categoriesByGroup).length ? (
              <FinanceEmptyState
                title="Nenhuma categoria cadastrada"
                description="Crie categorias de receita, despesa e aporte para usar em todas as outras telas."
                action={<CategorySetupDialog />}
              />
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArchiveAccountButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="flex-1"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await archiveAccountAction(id);
            toast.success("Conta arquivada.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      {isPending ? "Arquivando..." : "Arquivar"}
    </Button>
  );
}

function ArchiveCategoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await archiveCategoryAction(id);
            toast.success("Categoria arquivada.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      {isPending ? "Arquivando..." : "Arquivar"}
    </Button>
  );
}

function DeleteCategoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="icon-sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await deleteCategoryAction(id);
            toast.success("Categoria removida.");
            router.refresh();
          } catch (error) {
            toast.error(extractErrorMessage(error));
          }
        })
      }
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
