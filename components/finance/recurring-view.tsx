"use client";

import { RecurringCard } from "@/components/finance/recurring-card";

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
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Tabs,TabsContent } from "@/components/ui/tabs";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { RecurringViewProps } from "@/lib/interfaces/recurring";

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

      <Tabs defaultValue="recurring" className="gap-4">
        <RecurringSegmentedControl />

        <TabsContent value="recurring" className="mt-0">
          <Card className="gap-5 overflow-visible border-0 bg-transparent py-0 shadow-none">
            <CardHeader className="border-0 px-0 pb-0">
              <CardTitle className="text-lg">Recorrências cadastradas <span className="ml-2 text-sm font-normal text-content">({templates.length})</span></CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-0 md:grid-cols-2 2xl:grid-cols-3">
              {templates.length ? (
                templates.map((template) => (
                  <RecurringCard key={template.id} template={template} accounts={accounts} categories={categories} month={month} />
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
