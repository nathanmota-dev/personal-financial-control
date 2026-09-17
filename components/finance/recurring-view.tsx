"use client";

import { Pencil } from "lucide-react";

import { CategorySpendingCharts } from "@/components/finance/category-spending-charts";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { financeItemClassName } from "@/components/finance/finance-styles";
import { PageHeader } from "@/components/finance/page-header";
import {
  PauseRecurringButton,
  RecurringDeleteDialog,
  ResumeRecurringButton,
} from "@/components/finance/recurring-actions";
import { RecurringCalendar } from "@/components/finance/recurring-calendar";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { RecurringSegmentedControl } from "@/components/finance/recurring-segmented-control";
import {
  AccountSetupDialog,
  CategorySetupDialog,
  SetupCallout,
} from "@/components/finance/setup-dialogs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import type { RecurringViewProps } from "@/lib/interfaces/recurring";
import {
  formatCurrency,
  formatMonthLabel,
  getStatusTone,
  recurringStatusLabels,
  transactionTypeLabels,
} from "@/lib/finance-ui";
import { cn } from "@/lib/utils";

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
        description="Modele compromissos mensais com nome, categoria e data de geração. O histórico pode ser preservado ou excluído quando uma regra deixar de existir."
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
          <Card className="rounded-[1.75rem] border-border bg-surface/75">
            <CardHeader>
              <CardTitle>Recorrências cadastradas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {templates.length ? (
                templates.map((template) => (
                  <div key={template.id} className={cn(financeItemClassName, "rounded-[1.5rem] p-5")}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-xl font-semibold text-content-strong">
                            {template.description}
                          </h3>
                          <Badge className={cn("ring-1", getStatusTone(template.status))}>
                            {recurringStatusLabels[template.status]}
                          </Badge>
                          <Badge variant="outline">{transactionTypeLabels[template.type]}</Badge>
                        </div>
                        <div className={cn(financeItemClassName, "grid gap-2 p-3 text-sm text-content md:grid-cols-2")}>
                          <p>Conta: {template.account?.name ?? "-"}</p>
                          <p>Categoria: {template.category?.name ?? "-"}</p>
                          <p>Valor: {formatCurrency(template.amountCents)}</p>
                          <p>Dia de lançamento: {template.dayOfMonth}</p>
                          <p>Início: {formatMonthLabel(template.startMonth)}</p>
                          <p>Fim: {template.endMonth ? formatMonthLabel(template.endMonth) : "Sem fim"}</p>
                        </div>
                        <p className="rounded-xl border border-border bg-surface/30 px-3 py-2 text-sm leading-6 text-content">
                          {template.lastGeneratedMonth === month
                            ? `Já gerou lançamento em ${formatMonthLabel(month)}.`
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
                            <button
                              type="button"
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-input bg-transparent px-3 text-sm font-medium text-content-strong transition-colors hover:bg-surface-raised hover:text-content-strong focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                            >
                              <Pencil className="size-4" />
                              Editar
                            </button>
                          }
                        />
                        {template.status === "active" ? (
                          <PauseRecurringButton id={template.id} />
                        ) : template.status === "paused" ? (
                          <ResumeRecurringButton id={template.id} />
                        ) : null}
                        <RecurringDeleteDialog id={template.id} />
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
                        title="Base inicial obrigatória"
                        description="Você precisa de uma conta e uma categoria para criar uma recorrência."
                      />
                    )
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="mt-0">
          <CategorySpendingCharts categorySpending={categorySpending} className="xl:grid-cols-2" />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <RecurringCalendar key={month} month={month} templates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
