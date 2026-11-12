"use client";

import { Plus } from "lucide-react";

import { DashboardCategoryBars } from "@/components/finance/dashboard-category-bars";
import { DashboardHousing } from "@/components/finance/dashboard-housing";
import { HousingEntries } from "@/components/finance/housing-entries";
import { HousingMonthPicker } from "@/components/finance/housing-month-picker";
import { HousingTemplates } from "@/components/finance/housing-templates";
import { PageHeader } from "@/components/finance/page-header";
import { RecurringDialog } from "@/components/finance/recurring-dialog";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { Button } from "@/components/ui/button";
import { buildHousingDistribution } from "@/lib/dashboard-housing";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { HousingViewProps } from "@/lib/interfaces/housing";

export function HousingView({ month, housing, entries, templates, accounts, categories }: HousingViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Casa"
        title="Casa"
        description={`Tudo o que a casa custa em ${formatMonthLabel(month)}, quanto pesa no salário e o que se repete todo mês.`}
        actions={
          <>
            <HousingMonthPicker month={month} />
            <RecurringDialog accounts={accounts} categories={categories} month={month} trigger={<Button variant="outline"><Plus className="size-4" />Nova conta fixa da casa</Button>} />
            <TransactionDialog accounts={accounts} categories={categories} month={month} trigger={<Button><Plus className="size-4" />Novo item da casa</Button>} />
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardHousing data={housing} />
        <DashboardCategoryBars
          distribution={buildHousingDistribution(housing.items)}
          size="expanded"
          title="Gastos da casa"
          description="Peso relativo de cada item no mês"
          emptyMessage="Nenhum gasto de casa neste mês."
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <HousingEntries entries={entries} />
        <HousingTemplates templates={templates} />
      </div>
    </div>
  );
}
