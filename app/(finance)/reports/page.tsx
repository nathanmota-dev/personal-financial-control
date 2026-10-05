import Link from "next/link";
import { requirePageSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/finance/page-header";
import { ReportControls } from "@/components/finance/reports/controls";
import { ReportSummary } from "@/components/finance/reports/summary";
import { ReportTables } from "@/components/finance/reports/tables";
import { ReportEntries } from "@/components/finance/reports/entries";
import type { DashboardPageProps } from "@/lib/interfaces/dashboard";
import { parseReportPeriod, shiftReportPeriod } from "@/lib/report-periods";
import { getReport } from "@/lib/server/reports";
import { getFinanceDefaultMonth } from "@/lib/server/runtime";

export default async function ReportsPage({ searchParams }: DashboardPageProps) {
  await requirePageSession();
  const selection = parseReportPeriod(await searchParams, getFinanceDefaultMonth());
  if (!selection) return <section role="alert" className="space-y-4"><h1 className="text-2xl font-semibold">Período inválido</h1><p>Use modo mensal com AAAA-MM ou anual com AAAA, entre os anos 0002 e 9998.</p><Link className="text-brand underline" href="/reports">Consultar período atual</Link></section>;
  const report = await getReport(selection);
  return <div className="space-y-6">
    <PageHeader title="Relatórios" description="Consulte o histórico por competência e entenda o resultado antes e depois dos investimentos." actions={<ReportControls {...selection} previousPeriod={report.previousPeriod} nextPeriod={shiftReportPeriod(selection.mode, selection.period, 1)} />} />
    <ReportSummary report={report} />
    <ReportTables report={report} />
    <ReportEntries report={report} />
  </div>;
}
