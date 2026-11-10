"use client";

import { RecurringGroup } from "@/components/finance/recurring-group";
import { RecurringHero } from "@/components/finance/recurring-hero";

import { CategorySpendingCharts } from "@/components/finance/category-spending-charts";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import { RecurringCalendar } from "@/components/finance/recurring-calendar";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { RecurringSegmentedControl } from "@/components/finance/recurring-segmented-control";
import {
AccountSetupDialog,
CategorySetupDialog,
SetupCallout,
} from "@/components/finance/setup-dialogs";
import { Tabs,TabsContent } from "@/components/ui/tabs";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { RecurringViewProps } from "@/lib/interfaces/recurring";

const groups = [
  { type: "expense", title: "Despesas fixas", description: "Contas e assinaturas ordenadas pelo dia de vencimento." },
  { type: "income", title: "Receitas fixas", description: "Entradas previstas todos os meses." },
  { type: "investment_contribution", title: "Aportes programados", description: "Investimentos automáticos do mês." },
] as const;

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
        title="Recorrentes"
        description={`Organize seus compromissos mensais e acompanhe a agenda de ${formatMonthLabel(month)}.`}
        actions={
          <>
            <AccountSetupDialog />
            <CategorySetupDialog />
            <RecurringDialog accounts={accounts} categories={categories} month={month} />
          </>
        }
      />

      <RecurringHero month={month} templates={templates} />
      <Tabs defaultValue="recurring" className="gap-4">
        <RecurringSegmentedControl />

        <TabsContent value="recurring" className="mt-0">
          {templates.length ? (
            <div className="space-y-5">
              {groups.map((group) => {
                const rows = templates.filter((template) => template.type === group.type).sort((left, right) => left.dayOfMonth - right.dayOfMonth);
                return rows.length ? <RecurringGroup key={group.type} {...group} templates={rows} accounts={accounts} categories={categories} month={month} /> : null;
              })}
            </div>
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
        </TabsContent>

        <TabsContent value="category" className="mt-0">
          <CategorySpendingCharts categorySpending={categorySpending} size="expanded" className="2xl:grid-cols-2" />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <RecurringCalendar key={month} month={month} templates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
