"use client";

import { Landmark, Layers3, Plus } from "lucide-react";

import { CategorySpendingCharts } from "@/components/finance/category-spending-charts";
import { FinanceEmptyState } from "@/components/finance/empty-state";
import { PageHeader } from "@/components/finance/page-header";
import { RecurringAgenda } from "@/components/finance/recurring-agenda";
import { RecurringCalendar } from "@/components/finance/recurring-calendar";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { RecurringGroup } from "@/components/finance/recurring-group";
import { RecurringHeaderMonthPicker } from "@/components/finance/recurring-header-month-picker";
import { RecurringSegmentedControl } from "@/components/finance/recurring-segmented-control";
import { RecurringSummary } from "@/components/finance/recurring-summary";
import {
  AccountSetupDialog,
  CategorySetupDialog,
  SetupCallout,
} from "@/components/finance/setup-dialogs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { RecurringViewProps } from "@/lib/interfaces/recurring";

const groups = [
  { type: "expense", title: "Despesas fixas", description: "Contas e assinaturas ordenadas pelo dia de vencimento" },
  { type: "income", title: "Receitas fixas", description: "Entradas previstas todos os meses" },
  { type: "investment_contribution", title: "Aportes programados", description: "Investimentos automáticos do mês" },
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
    <div className="space-y-6 min-[100.0625rem]:space-y-5">
      <PageHeader
        eyebrow="Recorrentes"
        title="Recorrentes"
        description={`Organize seus compromissos mensais e acompanhe a agenda de ${formatMonthLabel(month)}.`}
        actions={
          <>
            <RecurringHeaderMonthPicker month={month} />
            <AccountSetupDialog trigger={<Button variant="secondary" className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium"><Landmark className="size-[17px]" />Nova conta</Button>} />
            <CategorySetupDialog trigger={<Button variant="secondary" className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium"><Layers3 className="size-[17px]" />Nova categoria</Button>} />
            <RecurringDialog
              accounts={accounts}
              categories={categories}
              month={month}
              trigger={<Button className="h-10 gap-[10px] rounded-[10px] text-[13px] font-medium"><Plus className="size-[17px]" />Nova recorrência</Button>}
            />
          </>
        }
      />

      <div className="grid gap-6 min-[100.0625rem]:gap-5 xl:grid-cols-[minmax(0,704fr)_minmax(0,390fr)]">
        <RecurringSummary month={month} templates={templates} />
        <RecurringAgenda month={month} templates={templates} />
      </div>

      <Tabs defaultValue="recurring" className="gap-4">
        <RecurringSegmentedControl />

        <TabsContent value="recurring" className="mt-0">
          {templates.length ? (
            <div className="space-y-6 min-[100.0625rem]:space-y-5">
              {groups.map((group) => {
                const rows = templates.filter((template) => template.type === group.type).sort((left, right) => left.dayOfMonth - right.dayOfMonth);
                return rows.length ? <RecurringGroup key={group.type} title={group.title} description={group.description} templates={rows} accounts={accounts} categories={categories} month={month} /> : null;
              })}
            </div>
          ) : (
            <section className="min-w-0 rounded-[20px] border border-border bg-card px-[22px] pt-5 pb-6">
              <h2 className="text-lg font-semibold leading-[25px]">Regras recorrentes</h2>
              <p className="mt-1 text-xs text-content-muted">Despesas, receitas e aportes que se repetem todo mês</p>
              <div className="mt-4">
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
              </div>
            </section>
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
