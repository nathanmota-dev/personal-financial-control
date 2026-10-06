"use client";

import { MonthlySummaryContent } from "@/components/finance/reports/monthly-summary-content";
import { ReportViewLoading } from "@/components/finance/reports/view-loading";
import { formatMonthLabel } from "@/lib/finance-ui";
import type { MonthlySummaryViewProps } from "@/lib/interfaces/monthly-retrospective";

export function MonthlySummary({ period, summary, error, retry }: MonthlySummaryViewProps) {
  return <section aria-label="Resumo do mês" className="min-w-0 space-y-4">
    <header><h2 className="text-xl font-semibold">Resumo do mês</h2><p className="mt-1 text-sm text-content">{formatMonthLabel(period)}</p></header>
    {summary ? <MonthlySummaryContent summary={summary} /> : <ReportViewLoading error={error} retry={retry} />}
  </section>;
}
