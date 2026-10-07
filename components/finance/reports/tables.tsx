"use client";

import { useState } from "react";
import { useReportViews } from "@/hooks/use-report-views";
import { useMonthlySummary } from "@/hooks/use-monthly-summary";
import { ReportViewLoading } from "@/components/finance/reports/view-loading";
import { shiftReportPeriod } from "@/lib/report-periods";
import { CalendarDays, ChartPie, List, BookOpen } from "lucide-react";
import { MonthlySummary } from "@/components/finance/reports/monthly-summary";
import { DailyExpensesView } from "@/components/finance/reports/daily-expenses-view";
import { ReportMonthlyTable } from "@/components/finance/reports/monthly-table";
import { ReportCategoryTable } from "@/components/finance/reports/category-table";
import { ReportEntries } from "@/components/finance/reports/entries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportInitialProps } from "@/lib/interfaces/reports";
import { useDailyExpenseMap } from "@/hooks/use-daily-expense-map";

export function ReportTables({ report }: ReportInitialProps) {
  const [view, setView] = useState("months");
  const views = useReportViews(report);
  const summary = useMonthlySummary({ period: report.period, enabled: report.mode === "monthly" && view === "summary" });
  const dailyExpenses = useDailyExpenseMap({ period: report.period, enabled: report.mode === "monthly" });
  return <Tabs value={view} onValueChange={setView} className="gap-4">
    <TabsList aria-label="Visualização do relatório" variant="line" className="max-w-full justify-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TabsTrigger value="months" className="shrink-0 px-3 text-xs sm:text-sm"><CalendarDays className="size-4" /><span>Meses do ano</span></TabsTrigger>
      <TabsTrigger value="categories" className="shrink-0 px-3 text-xs sm:text-sm"><ChartPie className="size-4" /><span>Categorias</span></TabsTrigger>
      <TabsTrigger value="sources" className="shrink-0 px-3 text-xs sm:text-sm"><List className="size-4" /><span>Origens dos totais</span></TabsTrigger>
      {report.mode === "monthly" && <TabsTrigger value="daily-expenses" className="shrink-0 px-3 text-xs sm:text-sm"><CalendarDays className="size-4" /><span>Despesas por data</span></TabsTrigger>}
      {report.mode === "monthly" && <TabsTrigger value="summary" className="shrink-0 px-3 text-xs sm:text-sm"><BookOpen className="size-4" /><span>Resumo do mês</span></TabsTrigger>}
    </TabsList>
    <TabsContent value="months" className="mt-0"><ReportMonthlyTable report={report} /></TabsContent>
    <TabsContent value="categories" className="mt-0">{views.categories ? <ReportCategoryTable report={{ categories: views.categories, previousPeriod: shiftReportPeriod(report.mode, report.period, -1), partial: report.partial }} /> : <ReportViewLoading error={views.categoryError} retry={views.retry} />}</TabsContent>
    <TabsContent value="sources" className="mt-0">{views.entries ? <ReportEntries report={{ entries: views.entries }} /> : <ReportViewLoading error={views.entriesError} retry={views.retry} />}</TabsContent>
    {report.mode === "monthly" && <TabsContent value="summary" className="mt-0"><MonthlySummary period={report.period} {...summary} /></TabsContent>}
    {report.mode === "monthly" && <TabsContent value="daily-expenses" className="mt-0">{dailyExpenses.map ? <DailyExpensesView map={dailyExpenses.map} /> : <ReportViewLoading error={dailyExpenses.error} retry={dailyExpenses.retry} />}</TabsContent>}
  </Tabs>;
}
