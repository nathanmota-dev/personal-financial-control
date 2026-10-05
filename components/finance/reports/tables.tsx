"use client";

import { useReportViews } from "@/hooks/use-report-views";
import { ReportViewLoading } from "@/components/finance/reports/view-loading";
import { shiftReportPeriod } from "@/lib/report-periods";
import { CalendarDays, ChartPie, List } from "lucide-react";
import { ReportMonthlyTable } from "@/components/finance/reports/monthly-table";
import { ReportCategoryTable } from "@/components/finance/reports/category-table";
import { ReportEntries } from "@/components/finance/reports/entries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReportInitialProps } from "@/lib/interfaces/reports";

export function ReportTables({ report }: ReportInitialProps) {
  const views = useReportViews(report);
  return <Tabs defaultValue="months" className="gap-4">
    <TabsList aria-label="Visualização do relatório" variant="line" className="max-w-full justify-start overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TabsTrigger value="months" className="shrink-0 px-3 text-xs sm:text-sm"><CalendarDays className="size-4" /><span>Meses do ano</span></TabsTrigger>
      <TabsTrigger value="categories" className="shrink-0 px-3 text-xs sm:text-sm"><ChartPie className="size-4" /><span>Categorias</span></TabsTrigger>
      <TabsTrigger value="sources" className="shrink-0 px-3 text-xs sm:text-sm"><List className="size-4" /><span>Origens dos totais</span></TabsTrigger>
    </TabsList>
    <TabsContent value="months" className="mt-0"><ReportMonthlyTable report={report} /></TabsContent>
    <TabsContent value="categories" className="mt-0">{views.categories ? <ReportCategoryTable report={{ categories: views.categories, previousPeriod: shiftReportPeriod(report.mode, report.period, -1), partial: report.partial }} /> : <ReportViewLoading error={views.categoryError} retry={views.retry} />}</TabsContent>
    <TabsContent value="sources" className="mt-0">{views.entries ? <ReportEntries report={{ entries: views.entries }} /> : <ReportViewLoading error={views.entriesError} retry={views.retry} />}</TabsContent>
  </Tabs>;
}
